import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-300 p-4">
      <SignUp />
    </div>
  );
}
