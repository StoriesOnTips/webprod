interface WelcomeCardProps {
  firstName: string
  motherTongue: string
}

export default function WelcomeCard({ firstName, motherTongue }: WelcomeCardProps) {
  const getGreetingEmoji = () => {
    const emojis = ["👋", "🌟", "🎉", "✨", "🚀"]
    return emojis[Math.floor(Math.random() * emojis.length)]
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        {getTimeBasedGreeting()}, {firstName}! {getGreetingEmoji()}
      </h2>
      <p className="text-muted-foreground">
        Your native language: <span className="font-medium text-foreground">{motherTongue}</span>
      </p>
      <div className="mt-3 text-sm text-muted-foreground">Ready to continue your language learning journey?</div>
    </div>
  )
}
