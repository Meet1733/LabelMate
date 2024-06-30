import About from "@/components/About";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Testimonial from "@/components/Testimonial";
import { FloatingNav } from "@/components/ui/FloatingNav";

export default function Home() {
  return (
    <main className=" relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
      <div className="max-w-7xl w-full">
        <FloatingNav
            navItems={[
              { name: "Home", link: "#home" },
              { name: "About", link: "#about" },
              { name: "Testimonials", link: "#testimonials" },
              { name: "FAQ's", link: "#faq" },
            ]}
        />
        <Hero/>
        <About/>
        <Testimonial/>
        <FAQ/>
        <Footer/>
      </div>
    </main>
  );
}
