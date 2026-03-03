import { StylusDemo } from "@/components/stylus-demo";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function StylusDemoPage() {
  return (
    <main className="min-h-screen py-20">
      <StylusDemo />
    </main>
  );
}
