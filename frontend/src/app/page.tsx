'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Shield, BarChart3, MessageSquare, Users, Zap,
  ArrowRight, CheckCircle2, Star, TrendingUp, Heart, Activity
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  })
};

const features = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'GPT-4o analyzes every feedback for sentiment, emotion, toxicity, and urgency in real-time.', color: 'text-brand-600', bg: 'bg-brand-50' },
  { icon: Shield, title: 'Anonymous & Secure', desc: 'Military-grade encryption for anonymous feedback with trackable resolution status.', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: BarChart3, title: 'Predictive Analytics', desc: '30-day forecasts for burnout, attrition risk, and organizational stress patterns.', color: 'text-brand-600', bg: 'bg-brand-50' },
  { icon: Activity, title: 'Burnout Detection', desc: 'Early warning system tracks stress patterns and predicts burnout before it happens.', color: 'text-danger-500', bg: 'bg-danger-50' },
  { icon: MessageSquare, title: 'Smart Resolution', desc: 'AI auto-routes complaints, suggests resolutions, and escalates when needed.', color: 'text-warning-500', bg: 'bg-warning-50' },
  { icon: Heart, title: 'Wellness Intelligence', desc: 'Personalized wellness recommendations based on individual and team health data.', color: 'text-success-500', bg: 'bg-success-50' },
];

const stats = [
  { value: '94%', label: 'Feedback Resolution Rate' },
  { value: '3.2x', label: 'Faster Issue Detection' },
  { value: '67%', label: 'Reduction in Burnout Cases' },
  { value: '500+', label: 'Organizations Trust Us' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'VP of People, TechCorp', text: 'PulseMind AI transformed how we understand our workforce. Burnout detection alone saved us from losing 12 key engineers.', rating: 5 },
  { name: 'Marcus Johnson', role: 'CHRO, GlobalScale Inc', text: 'The AI analytics are incredible. We went from quarterly surveys to real-time organizational intelligence.', rating: 5 },
  { name: 'Priya Patel', role: 'HR Director, InnovateLab', text: 'Anonymous feedback with AI analysis gave our employees a real voice. Engagement scores jumped 40% in 6 months.', rating: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-text-primary">PulseMind<span className="text-brand-600">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Testimonials</Link>
            <Link href="#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2">Sign in</Link>
            <Link href="/register" className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> Powered by GPT-4o AI Engine
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-5xl md:text-7xl font-bold text-text-primary leading-tight mb-6 max-w-4xl mx-auto">
            Where Organizational Intelligence Meets{' '}
            <span className="gradient-text">Human Empathy</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform employee feedback into actionable intelligence with AI-powered sentiment analysis, 
            burnout prediction, and smart complaint resolution.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="group flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 text-base">
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-8 py-3.5 border border-border text-text-primary font-semibold rounded-xl hover:bg-surface-secondary transition-all duration-200 text-base">
              View Demo Dashboard
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              15 AI Engines Working for Your Organization
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From sentiment analysis to attrition prediction — every aspect of organizational health, monitored and optimized.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                className="card-elevated p-6 group cursor-default">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">How It Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Submit Feedback', desc: 'Employees share thoughts through our intelligent multi-step form with voice input support.' },
              { step: '02', title: 'AI Analyzes', desc: 'GPT-4o processes sentiment, emotion, toxicity, and urgency in real-time.' },
              { step: '03', title: 'Smart Routing', desc: 'Complaints auto-route to the right team with AI-suggested resolutions.' },
              { step: '04', title: 'Actionable Insights', desc: 'Leaders get predictive analytics and concrete recommendations.' },
            ].map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 font-display font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">Trusted by HR Leaders</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                className="card-elevated p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-warning-500 text-warning-500" />
                  ))}
                </div>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-display font-semibold text-sm text-text-primary">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">Simple, Transparent Pricing</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '$49', period: '/month', desc: 'For small teams getting started', features: ['Up to 50 employees', '5 AI engines', 'Basic analytics', 'Email support'], highlighted: false },
              { name: 'Professional', price: '$149', period: '/month', desc: 'For growing organizations', features: ['Up to 500 employees', 'All 15 AI engines', 'Advanced analytics & predictions', 'Priority support', 'Custom branding'], highlighted: true },
              { name: 'Enterprise', price: '$399', period: '/month', desc: 'For large enterprises', features: ['Unlimited employees', 'All features + custom engines', 'Dedicated success manager', 'SLA guarantee', 'SSO & advanced security', 'On-premise deployment'], highlighted: false },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                className={`rounded-2xl p-8 ${plan.highlighted ? 'bg-brand-600 text-white ring-2 ring-brand-600 shadow-xl scale-105' : 'card-elevated'}`}>
                <h3 className={`font-display text-lg font-semibold ${plan.highlighted ? 'text-white' : 'text-text-primary'} mb-1`}>{plan.name}</h3>
                <p className={`text-sm ${plan.highlighted ? 'text-brand-200' : 'text-text-secondary'} mb-4`}>{plan.desc}</p>
                <div className="mb-6">
                  <span className={`font-display text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-text-primary'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-brand-200' : 'text-text-muted'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-brand-200' : 'text-success-500'}`} />
                      <span className={plan.highlighted ? 'text-white' : 'text-text-secondary'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${plan.highlighted ? 'bg-white text-brand-600 hover:bg-brand-50' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-brand-600 to-brand-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Organization?
          </h2>
          <p className="text-lg text-brand-200 mb-8">
            Join 500+ companies using PulseMind AI to build healthier, more productive workplaces.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-all duration-200 hover:shadow-xl text-base">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-text-primary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">PulseMind<span className="text-brand-400">AI</span></span>
          </div>
          <p className="text-sm text-text-muted">© 2024 PulseMind AI. All rights reserved. Where Organizational Intelligence Meets Human Empathy.</p>
        </div>
      </footer>
    </div>
  );
}
