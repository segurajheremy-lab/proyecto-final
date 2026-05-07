import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import LeadGenSection from '../components/LeadGenSection'
import QuienesSomosSection from '../components/QuienesSomosSection'
import QueOfrecemosSection from '../components/QueOfrecemosSection'
import DashboardSection from '../components/DashboardSection'
import ImpactBanner from '../components/ImpactBanner'
import VideoDemoSection from '../components/VideoDemoSection'
import SocialProofSection from '../components/SocialProofSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <LeadGenSection />
        <QuienesSomosSection />
        <QueOfrecemosSection />
        <DashboardSection />
        <ImpactBanner />
        <VideoDemoSection />
        <SocialProofSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
