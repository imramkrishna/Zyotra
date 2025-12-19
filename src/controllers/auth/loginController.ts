import { Context } from "elysia";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { StatusCode } from "../../types/types";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../../jwt/generateTokens";

const loginController = async ({ body, set }: Context) => {
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
        
        const isProd = true;
        
        console.log('Is Production Environment:', isProd);
        
        // Build the response body
        const responseBody = JSON.stringify({ 
            message: "Login successful", 
            userId: user[0].id, 
            accessToken 
        });
        
        // Create headers object
        const headers = new Headers({
            'Content-Type': 'application/json'
        });
        
        // Append Set-Cookie headers separately (this is the correct way for multiple cookies)
        headers.append(
            'Set-Cookie', 
            `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Domain=.ramkrishna.cloud; Path=/; Max-Age=${15 * 24 * 60 * 60}`
        );
        headers.append(
            'Set-Cookie', 
            `accessToken=${accessToken}; HttpOnly; Secure; SameSite=None; Domain=.ramkrishna.cloud; Path=/; Max-Age=${15 * 60}`
        );
        
        console.log('Setting cookies with domain .ramkrishna.cloud');
        
        // Return Response object
        return new Response(responseBody, {
            status: 200,
            headers: headers
        });
        
    } catch (error) {
        console.error('Login error:', error);
        set.status = StatusCode.INTERNAL_SERVER_ERROR;
        return { message: "An error occurred during login" };
    }
}

export default loginController;