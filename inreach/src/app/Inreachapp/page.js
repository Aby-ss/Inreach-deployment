import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <section className="items-center justify-items-center">
          <h1 className="gabarito-semibold tracking-tighter text-6xl w-[900px] text-center">
            Get More Clients By Scaling Your Cold Email Outreach
          </h1>

          <Link href="/Inreachapp" className="center">
            <button className="bg-[#686AF1] text-[#FFFFFF] px-6 py-2 rounded-[50px] text-lg gabarito-semibold shadow-lg flex items-center absolute left-[620px] top-[500px]">
              Get Started
            </button>
          </Link>
        </section>
      </main>
    </div>
  );
}
