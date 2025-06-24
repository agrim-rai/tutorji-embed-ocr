import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function handler(req, res) { 
  const session = await getServerSession(req, res, authOptions)

  if (session) {
    res.status(200).json({ loggedIn: true, user: session.user })
  } else {
    res.status(200).json({ loggedIn: false })
  }
}
