import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import CodePreview from '@/components/landing/CodePreview'
import Architecture from '@/components/landing/Architecture'
import Roadmap from '@/components/landing/Roadmap'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CodePreview />
      <Architecture />
      <Roadmap />
    </>
  )
}
