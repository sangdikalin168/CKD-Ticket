import { JwtPayload } from 'jsonwebtoken'

export type UserAuthPayload = JwtPayload & {
    user_id: number
    tokenVersion: number
    /** Users.role at issue time. Absent on tokens minted before the claim
     *  existed — those are treated as staff (kiosk accounts came later). */
    role?: string
}