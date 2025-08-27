import { Wand, Brain, House, Bot,Pen, Shield } from 'lucide-react'

export default function LandingFeatures() {
  const features = [
    {
      id: 'fast',
      icon: Wand,
      title: 'Instant Magic',
      description: 'Create personalized stories instantly to spark imagination and joy.'
    },
    {
      id: 'powerful',
      icon: Brain,
      title: 'Smart Engine',
      description: 'Experience cutting-edge technology that makes learning seamless.'
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Safe, reliable, and built with strong protection in mind.'
    },
    {
      id: 'customization',
      icon: Pen,
      title: 'Made for You',
      description: 'Tailor stories with themes, styles, and details that fit every learner.'
    },
    {
      id: 'control',
      icon: House,
      title: 'Your Space',
      description: 'All the control you need, from tracking to insights, in one place.'
    },
    {
      id: 'AI-Powered',
      icon: Bot,
      title: 'Built for AI',
      description: 'Smarter learning, powered by advanced AI technology.'
    }
  ]
  
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="mb-16 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
            <span className="text-sm text-white/80 font-medium">
              Features
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-none mb-6">
            Explore our features
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed font-light">
            features that are fascinating for kids and language learners
          </p>
        </div>

        <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div key={feature.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconComponent className="size-4" />
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                </div>
                <p className="text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}