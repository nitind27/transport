import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheme Serve",
  description:
    "Scheme Serve",
};

export default function SignIn() {
  return <SignInForm />;
}
