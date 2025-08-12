import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheme Serve",
  description:
    "Scheme Serve",
};

export default function SignUp() {
  return <SignUpForm />;
}
