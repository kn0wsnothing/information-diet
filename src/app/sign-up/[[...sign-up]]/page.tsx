import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex max-w-3xl justify-center px-6 py-16">
        <SignUp />
      </div>
    </div>
  );
}
