/*
 * Asset credits
 *
 * Third-party illustrations and graphics available to this site, by source. Add a line for
 * each new source.
 *
 * - "1,600 Free Illustrations: Vector illustrations set (svg, png)" by Streamline
 *   (https://www.streamlinehq.com), via the Figma Community.
 * - "SVG Abstract Patterns & Illustrations Library" by Pavan Kondapuram, via the Figma
 *   Community.
 * - "1000 textures", via the Figma Community
 *   (https://www.figma.com/community/file/1370508545199042511).
 * - "Background Grid patterns for website design || Grids", via the Figma Community.
 * - "Crazy Beautiful Complex Gradients", via the Figma Community.
 */

import type { Metadata } from "next";

import { Contact } from "@/components/sections/contact";
import { Engagements } from "@/components/sections/engagements/engagements";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero/hero";
import { Navbar } from "@/components/sections/navbar";
import { Process } from "@/components/sections/process/process";
import { Services } from "@/components/sections/services/services";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { GrowIn } from "@/components/motion/grow";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { ScrollProgress } from "@/components/ui/scroll-progress";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Engagements />
        <Process />
        <GrowIn>
          <Contact />
        </GrowIn>
      </main>
      <Footer />
    </>
  );
}
