import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/Layout';
import { Zap, Rocket, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Rocket,
      title: 'Instant Setup',
      description: 'Connect your wallet and launch your board in under 60 seconds.',
    },
    {
      icon: Zap,
      title: 'Live Engagement',
      description: 'Real-time Lightning payments with instant message display.',
    },
    {
      icon: Shield,
      title: 'Zero Trust',
      description: 'Fully decentralized. No accounts, no tracking, no middlemen.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-linear-to-b from-background via-background to-muted/20 py-20 md:py-32">
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >

            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Lightning
              <span className="text-primary"> Zap</span>
              <br />
              Message Boards
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mb-10 text-lg text-muted-foreground md:text-xl lg:text-2xl"
            >
              Engage your audience with Bitcoin-powered live messages.
              <br className="hidden md:block" />
              No accounts. No complexity. Just pure interaction.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate('/create')}
                className="group h-14 px-8 text-lg"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Launch Your Board
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/zapme')}
                className="h-14 px-8 text-lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Support Dev
              </Button>
            </motion.div>
          </motion.div>
        </Container>

        {/* Enhanced Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[48px_48px]" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Why BillboardBit?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Built for creators, speakers, and communities who value speed and sovereignty.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <Card className="group relative overflow-hidden border-2 transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <CardHeader>
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-all group-hover:scale-110 group-hover:bg-primary/20">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="border-t bg-muted/30 py-20 md:py-32">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Three Steps to Launch
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              From zero to live in under a minute
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl space-y-6">
            {[
              {
                step: '1',
                title: 'Connect Wallet',
                description: 'Paste your NWC connection string. No registration required.',
              },
              {
                step: '2',
                title: 'Share Link',
                description: 'Get your unique board URL. Share it anywhere.',
              },
              {
                step: '3',
                title: 'Go Live',
                description: 'Watch Lightning zaps turn into live messages instantly.',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="flex gap-6 rounded-2xl border-2 bg-card p-6 transition-all hover:shadow-lg md:p-8"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground md:h-16 md:w-16">
                  {step.step}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-base text-muted-foreground md:text-lg">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 text-center"
          >
            <Button
              size="lg"
              onClick={() => navigate('/create')}
              className="h-14 px-10 text-lg"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Start Building Now
            </Button>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
