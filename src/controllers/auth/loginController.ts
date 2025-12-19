import { Context } from "elysia";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { StatusCode } from "../../types/types";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../../jwt/generateTokens";

const loginController = async ({ body, set, cookie }: Context) => {
    const { email, password } = body as { email: string, password: string };
    try {
        const user = await db.select().from(users).where(eq(users.email, email));
        if (user.length === 0) {
            set.status = StatusCode.FORBIDDEN;
            return { message: "Invalid email or password" };
        }
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        if (!isPasswordValid) {
            set.status = StatusCode.FORBIDDEN;
            return { message: "Invalid email or password" };
        }
        
        const accessToken = await generateAccessToken(user[0].id.toString());
        const refreshToken = await generateRefreshToken(user[0].id.toString());
        
        // Set cookies with explicit domain
        cookie.refreshToken.set({
            value: refreshToken,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            domain: '.ramkrishna.cloud',  // Try WITHOUT the leading dot
            path: '/',
            maxAge: 15 * 24 * 60 * 60,
        });

        cookie.accessToken.set({
            value: accessToken,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            domain: '.ramkrishna.cloud',  // Try WITHOUT the leading dot
            path: '/',
            maxAge: 15 * 60,
        });
        
        console.log('Cookies set with domain: ramkrishna.cloud (without leading dot)');
        
        set.status = StatusCode.OK;
        return { message: "Login successful", userId: user[0].id, accessToken };
    } catch (error) {
        console.error('Login error:', error);
        set.status = StatusCode.INTERNAL_SERVER_ERROR;
        return { message: "An error occurred during login" };
    }
}

export default loginController;