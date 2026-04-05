import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto, TokensDto, TokenPayload } from '../dtos/auth.dto';
// import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { verifyPassword } from '@/utils/password';
import { randomUUID } from 'crypto';
import { Role } from '@/types/role.enum';
import { EmailService } from '@/email/services/email.services';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '@/utils/password';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    // Convert email to lowercase
    const lowercaseEmail = email.toLowerCase();

    // Find user with lowercase email
    const user = await this.usersService.findByEmail(lowercaseEmail);
    if (!user) {
      throw new BadRequestException('მომხმარებელი ვერ მოიძებნა');
    }

    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 საათი

    await user.save();
    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }, // Ensure token is not expired
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
  }

  async singInWithGoogle(googleData: {
    email: string;
    name: string;
    id: string;
    sub?: string;
  }) {
    // Convert email to lowercase
    const email = googleData.email.toLowerCase();

    let existUser = await this.userModel.findOne({ email });

    console.log('🆕 ახალი მომხმარებლის რეგისტრაცია Google-ით:', googleData);

    if (!existUser) {
      const newUser = new this.userModel({
        email,
        name: googleData.name || 'Google User',
        googleId: googleData.id || googleData.sub, // Google ID უნდა შევინახოთ
        role: Role.User,
      });

      await newUser.save(); // ⬅️ აქამდე უკვე აქვს googleId მნიშვნელობა, ამიტომ password არ ითვლება required

      existUser = newUser;
      console.log('✅ ახალი მომხმარებელი წარმატებით დაემატა:', existUser);
    }

    const { tokens, user: userData } = await this.login(existUser);

    console.log('✅ გენერირებული access_token და refresh_token:', tokens);
    return { tokens, user: userData };
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    // Convert email to lowercase for case-insensitive comparison
    const lowercaseEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(lowercaseEmail);

    if (!user) {
      throw new UnauthorizedException('არასწორი მეილი ან პაროლი.');
    }

    const isPasswordValid = await verifyPassword(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('არასწორი მეილი ან პაროლი.');
    }

    return user;
  }

  async login(user: UserDocument): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);

    return {
      tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        // isAdmin: user.isAdmin,
        role: user.role,
      },
    };
  }

  private async generateTokens(user: UserDocument): Promise<TokensDto> {
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user._id.toString(),
          email: user.email,
          // isAdmin: user.isAdmin,
          role: user.role,
          type: 'access',
        } as TokenPayload,
        {
          expiresIn: '15m', // 15 minutes for production
          secret: process.env.JWT_ACCESS_SECRET,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user._id.toString(),
          email: user.email,
          // isAdmin: user.isAdmin,
          role: user.role,
          type: 'refresh',
          jti,
        } as TokenPayload,
        {
          expiresIn: '30d', // 30 days - user stays logged in for a month
          secret: process.env.JWT_REFRESH_SECRET,
        },
      ),
    ]);

    // Add new refresh token to array (supports multiple devices/sessions)
    // Limit to 10 active sessions max, remove oldest if exceeded
    const MAX_SESSIONS = 10;
    await this.userModel.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          $each: [jti],
          $slice: -MAX_SESSIONS, // Keep only the last MAX_SESSIONS tokens
        },
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<TokensDto> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException();
      }

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
        throw new UnauthorizedException();
      }

      // Check if the refresh token JTI exists in the array (supports multiple sessions)
      if (!user.refreshTokens.includes(payload.jti)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Remove old token and add new one (token rotation for security)
      await this.userModel.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: payload.jti },
      });

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException();
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Logout only from current session (remove specific token)
      try {
        const payload = await this.jwtService.verifyAsync<TokenPayload>(
          refreshToken,
          { secret: process.env.JWT_REFRESH_SECRET },
        );
        if (payload.jti) {
          await this.userModel.findByIdAndUpdate(userId, {
            $pull: { refreshTokens: payload.jti },
          });
          return;
        }
      } catch {
        // Token invalid, just clear all
      }
    }
    // Logout from all sessions
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokens: [],
    });
  }
}
