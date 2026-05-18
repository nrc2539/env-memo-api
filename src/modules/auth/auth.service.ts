import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { generateToken } from '../../../utils/generate-token.util';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import type { UserModel } from '../../generated/models/User.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { SetupPasswordDto } from './dto/setup-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { VerifyTokenDto } from './dto/verify-token.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    return { message: 'User registered successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify<{ sub: string; email: string }>(
        dto.refreshToken,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: +payload.sub },
    });

    if (
      !user ||
      user.refreshToken !== dto.refreshToken ||
      !user.refreshTokenExpiry ||
      user.refreshTokenExpiry < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens(user.id, user.email);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const resetToken = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await this.emailService.sendResetPasswordEmail(user.email, resetToken);

    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  async setupPassword(dto: SetupPasswordDto) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { token: dto.token, status: 'PENDING' },
    });

    if (!invitation || !invitation.invitedUserId) {
      throw new BadRequestException('Invalid or expired setup token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: invitation.invitedUserId },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired setup token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        name: dto.name,
      },
    });

    const invitations = await this.prisma.invitation.findMany({
      where: { invitedUserId: user.id, status: 'PENDING' },
    });

    if (invitations.length > 0) {
      await this.prisma.$transaction([
        ...invitations.map((inv) =>
          this.prisma.projectMember.create({
            data: {
              userId: user.id,
              projectId: inv.projectId,
              role: inv.role,
            },
          }),
        ),
        ...invitations.map((inv) =>
          this.prisma.invitation.update({
            where: { id: inv.id },
            data: { status: 'ACCEPTED' },
          }),
        ),
      ]);
    }

    return { message: 'Password set successfully' };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const trimmedName = dto.name.trim();

    if (!trimmedName) {
      throw new BadRequestException(
        'Name must not be empty or whitespace only',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { name: trimmedName },
    });

    return { message: 'Profile updated successfully' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new BadRequestException(
        'Password change not available for this account',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async verifyToken(dto: VerifyTokenDto) {
    let user: UserModel | null = null;

    if (dto.type === 'reset' || !dto.type) {
      user = await this.prisma.user.findFirst({
        where: {
          resetToken: dto.token,
          resetTokenExpiry: { gt: new Date() },
        },
      });
    }

    if (!user && (dto.type === 'setup' || !dto.type)) {
      const invitation = await this.prisma.invitation.findFirst({
        where: { token: dto.token, status: 'PENDING' },
      });
      if (invitation) {
        user = await this.prisma.user.findUnique({
          where: { id: invitation.invitedUserId! },
        });
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const tokenType = user.resetToken === dto.token ? 'reset' : 'setup';

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      tokenType,
    };
  }

  private async generateTokens(userId: number, email: string) {
    const sub = userId.toString();
    const accessToken = this.jwtService.sign(
      { sub, email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub, email, type: 'refresh' },
      { expiresIn: '7d' },
    );

    await this.updateRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken, refreshTokenExpiry },
    });
  }
}
