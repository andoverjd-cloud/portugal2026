import { days, hotels } from "@/lib/itinerary";
import DaySection from "@/components/DaySection";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="relative py-24 px-4 text-center overflow-hidden" style={{ minHeight: "420px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/portugal-hero.jpg"
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,25,50,0.52)" }} />

        <div className="relative z-10">
          <p className="text-terra-light/90 text-sm uppercase tracking-[0.3em] font-medium mb-4">
            October 18 – 26, 2026
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-sand mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Portugal
          </h1>
          <p className="text-sand/60 text-lg font-light mb-2">
            John · Lea
          </p>
          <p className="text-terra-light text-lg font-semibold tracking-widest mb-8 uppercase" style={{ letterSpacing: "0.25em" }}>
            ✦ 10th Anniversary ✦
          </p>
          <div className="inline-flex flex-wrap gap-3 justify-center">
            {Object.values(hotels).map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sand/80 text-xs hover:text-sand transition-colors"
              >
                <span>🏨</span>
                {hotel.name}
              </a>
            ))}
            <a href="/memories" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sand/80 text-xs hover:text-sand transition-colors">
              <span>📸</span> Memories
            </a>
          </div>
        </div>
      </header>

      {/* Intro strip */}
      <div className="bg-azure py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-6 justify-center text-center text-sand/80 text-sm">
          <div>
            <div className="text-terra font-semibold text-lg">8</div>
            <div className="text-xs uppercase tracking-wide">Nights</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-terra font-semibold text-lg">3</div>
            <div className="text-xs uppercase tracking-wide">Regions</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-terra font-semibold text-lg">4</div>
            <div className="text-xs uppercase tracking-wide">Hotels</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-terra font-semibold text-lg">10 Years</div>
            <div className="text-xs uppercase tracking-wide">Together</div>
          </div>
        </div>
      </div>

      {/* Day sections */}
      {days.map((day) => (
        <DaySection key={day.id} day={day} />
      ))}

      {/* Footer */}
      <footer className="bg-azure-dark py-12 px-4 text-center text-sand/40 text-sm">
        <p className="font-serif text-sand/60 text-lg mb-2">Feliz aniversário 🇵🇹</p>
        <p className="text-xs">John & Lea · October 2026</p>
      </footer>
    </main>
  );
}
