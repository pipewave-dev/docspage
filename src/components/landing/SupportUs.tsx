import { useState, useEffect } from "react";
import { motion } from "framer-motion";

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

const REPOS = [
  {
    key: "go" as const,
    slug: "pipewave-dev/go-pkg",
    label: "go-pkg",
    lang: "Go",
    langClass: "text-primary-400",
    url: "https://github.com/pipewave-dev/go-pkg",
  },
  {
    key: "react" as const,
    slug: "pipewave-dev/reactpkg",
    label: "reactpkg",
    lang: "React",
    langClass: "text-accent-400",
    url: "https://github.com/pipewave-dev/reactpkg",
  },
];

// const DONATION_LINKS: {
//   label: string;
//   shortLabel: string;
//   icon: string;
//   colorClass: string;
//   borderClass: string;
//   bgClass: string;
//   href?: string;
// }[] = [
//   {
//     label: "GitHub Sponsors",
//     shortLabel: "GH Sponsors",
//     icon: "💜",
//     colorClass: "text-violet-400",
//     borderClass: "border-violet-500/30",
//     bgClass: "bg-violet-500/10",
//     // href: "https://github.com/sponsors/{username}",
//   },
//   {
//     label: "Support on Ko-fi",
//     shortLabel: "Ko-fi",
//     icon: "♥",
//     colorClass: "text-[#ff5e5b]",
//     borderClass: "border-[#ff5e5b]/30",
//     bgClass: "bg-[#ff5e5b]/10",
//     href: "https://ko-fi.com/yunerou",
//   },
//   {
//     label: "Buy Me a Coffee",
//     shortLabel: "Buy a Coffee",
//     icon: "☕",
//     colorClass: "text-[#ffdd00]",
//     borderClass: "border-[#ffdd00]/30",
//     bgClass: "bg-[#ffdd00]/10",
//     // href: "https://www.buymeacoffee.com/{username}",
//   },
// ];

const CACHE_TTL = 3_600_000; // 1 hour

export default function SupportUs() {
  const [stars, setStars] = useState<{
    go: number | null;
    react: number | null;
  }>({
    go: null,
    react: null,
  });

  useEffect(() => {
    const controllers: AbortController[] = [];

    REPOS.forEach(({ key, slug }) => {
      const cacheKey = `pw_stars_${slug.replace("/", "_")}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { count, fetchedAt } = JSON.parse(cached) as {
            count: number;
            fetchedAt: number;
          };
          if (Date.now() - fetchedAt < CACHE_TTL) {
            setStars((prev) => ({ ...prev, [key]: count }));
            return;
          }
        } catch {
          // ignore malformed cache entries
        }
      }

      const controller = new AbortController();
      controllers.push(controller);

      fetch(`https://api.github.com/repos/${slug}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data: { stargazers_count: number }) => {
          const count = data.stargazers_count;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ count, fetchedAt: Date.now() }),
          );
          setStars((prev) => ({ ...prev, [key]: count }));
        })
        .catch(() => {});
    });

    return () => controllers.forEach((c) => c.abort());
  }, []);

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Love Pipewave?
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            A ⭐ on GitHub helps others find the project.
          </p>
        </motion.div>
        <div className="mt-16 flex justify-center">
          {/* GitHub Star card */}
          <motion.div
            className="w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900/30 p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="mb-5 flex items-center gap-2">
              <GitHubIcon className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                Star on GitHub
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              {REPOS.map((repo) => (
                <a
                  key={repo.key}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-slate-800 bg-slate-950 p-3 text-center transition-colors hover:border-slate-700"
                >
                  <div
                    className={`mb-1.5 text-[9px] font-bold uppercase tracking-widest ${repo.langClass}`}
                  >
                    {repo.lang}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xl font-extrabold text-amber-400">
                    ⭐
                    {stars[repo.key] !== null && (
                      <span>{formatStars(stars[repo.key]!)}</span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {repo.label}
                  </div>
                </a>
              ))}
            </div>

            <a
              href="https://github.com/pipewave-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              View pipewave-dev on GitHub
            </a>
          </motion.div>
        </div>
        {/* <div className="mt-8 flex justify-center">
          <motion.div
            className="w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900/30 p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-linear-to-br from-primary-500/5 to-transparent flex h-full flex-col rounded-lg">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                  Support Development
                </span>
              </div>

              <p className="text-base font-semibold text-white">
                Buy me a coffee ☕
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Pipewave is free and open source. Your support helps fund new
                features, maintenance, and keeping the servers running.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {DONATION_LINKS.map((link) => (
                  <a
                    key={link.label}
                    {...(link.href
                      ? {
                          href: link.href,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all hover:brightness-125 hover:scale-[1.02] ${link.bgClass} ${link.borderClass} ${!link.href ? "cursor-default opacity-60" : ""}`}
                  >
                    <span className="text-2xl">{link.icon}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${link.colorClass}`}
                    >
                      {link.shortLabel}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div> */}
      </div>
    </section>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
