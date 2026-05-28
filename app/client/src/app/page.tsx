import Link from "next/link";

const links = [
  {
    href: "/network",
    text: "Nework",
  },
  {
    href: "/qlearning",
    text: "Q-Learning",
  },
  {
    href: "/dqlearning",
    text: "Deep Q-Learning",
  },
  {
    href: "/transformer",
    text: "Transformer",
  },
];

export default function HomePage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="grid grid-cols-2 gap-6">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="border border-blue-800 flex justify-center items-center w-50 h-25 rounded duration-300 hover:bg-blue-950"
          >
            {l.text}
          </Link>
        ))}
      </div>
    </div>
  );
}
