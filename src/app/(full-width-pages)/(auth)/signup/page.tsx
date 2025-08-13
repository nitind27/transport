import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MDM",
  description:
    "MDM",
};

export default function SignUp() {
  return <SignUpForm />;
}
