import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/Layout";
import { Copy, Bitcoin, Zap, CheckCircle2, Shield, Globe } from "lucide-react";

export default function ZapMe() {
  const [paymentMethod, setPaymentMethod] = useState<"lightning" | "onchain">("lightning");
  const [copied, setCopied] = useState(false);

  const LIGHTNING_ADDRESS = "milad@getalby.com";
  const BITCOIN_ADDRESS = "bc1qw3qjweeuvv3hkm039q3hzsuhj22v54m830s5yz";

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentAddress = paymentMethod === "lightning" ? LIGHTNING_ADDRESS : BITCOIN_ADDRESS;
  const qrValue = paymentMethod === "lightning" ? `lightning:${LIGHTNING_ADDRESS}` : `bitcoin:${BITCOIN_ADDRESS}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/5 to-muted/10">
      <Container className="py-8 sm:py-12 md:py-16 lg:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl space-y-8 sm:space-y-12"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="space-y-4 text-center">
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Zap the Builder
              </h1>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
                Every sat powers innovation. Support decentralized development with Bitcoin.
              </p>
            </div>
          </motion.div>

          {/* Main Payment Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="space-y-2 border-b bg-muted/30 pb-6">
                <CardTitle className="text-center text-2xl sm:text-3xl">
                  Choose Your Payment Method
                </CardTitle>
                <CardDescription className="text-center text-sm sm:text-base">
                  Lightning for instant micro-payments, or on-chain for larger amounts
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 md:p-8">
                <Tabs 
                  value={paymentMethod} 
                  onValueChange={(value) => setPaymentMethod(value as "lightning" | "onchain")}
                  className="w-full"
                >
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/50 p-2">
                    <TabsTrigger 
                      value="lightning" 
                      className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-semibold">Lightning</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="onchain"
                      className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-semibold">On-Chain</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 space-y-6">
                    {/* Address Section */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={paymentMethod}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="gap-1.5 text-xs font-medium uppercase tracking-wider">
                              {paymentMethod === "lightning" ? (
                                <>
                                  <Zap className="h-3 w-3" />
                                  Lightning Address
                                </>
                              ) : (
                                <>
                                  <Bitcoin className="h-3 w-3" />
                                  Bitcoin Address
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="group relative overflow-hidden rounded-xl border-2 border-muted bg-muted/30 p-4 transition-all hover:bg-muted/50">
                            <code className="block break-all text-center font-mono text-sm leading-relaxed sm:text-base">
                              {currentAddress}
                            </code>
                          </div>

                          <Button
                            onClick={() => handleCopy(currentAddress)}
                            className="group w-full gap-2 py-6 text-base font-semibold"
                            size="lg"
                          >
                            <AnimatePresence mode="wait">
                              {copied ? (
                                <motion.div
                                  key="copied"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span>Copied to Clipboard!</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="flex items-center gap-2"
                                >
                                  <Copy className="h-5 w-5" />
                                  <span>Copy Address</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </div>

                        <Separator className="my-6" />

                        {/* QR Code Section */}
                        <div className="space-y-3">
                          <p className="text-center text-sm font-medium text-muted-foreground">
                            Scan with your Bitcoin wallet
                          </p>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center"
                          >
                            <div className="rounded-lg border bg-white p-6">
                              <QRCodeSVG
                                value={qrValue}
                                size={220}
                                level="H"
                                includeMargin
                              />
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <TabsContent value="lightning" className="mt-6 space-y-4">
                      <div className="rounded-lg border bg-primary/5 p-4">
                        <div className="flex gap-3">
                          <Zap className="h-5 w-5 shrink-0 text-primary" />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">Instant & Low Cost</p>
                            <p className="text-xs text-muted-foreground">
                              Lightning payments are near-instant with minimal fees. Perfect for any amount.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="onchain" className="mt-6 space-y-4">
                      <div className="rounded-lg border bg-primary/5 p-4">
                        <div className="flex gap-3">
                          <Shield className="h-5 w-5 shrink-0 text-primary" />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">Secure & Final</p>
                            <p className="text-xs text-muted-foreground">
                              On-chain transactions are settled on the Bitcoin blockchain. Best for larger amounts.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Trustless",
                  description: "No intermediaries. Direct peer-to-peer."
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Instant settlement with Lightning Network."
                },
                {
                  icon: Globe,
                  title: "Borderless",
                  description: "Send from anywhere, anytime."
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Card className="group transition-all hover:border-primary">
                    <CardContent className="p-6 text-center">
                      <feature.icon className="mx-auto mb-3 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                      <h3 className="mb-1 font-semibold">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer Quote */}
          <motion.div
            variants={itemVariants}
            className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center backdrop-blur-sm sm:p-8"
          >
            <blockquote className="space-y-2">
              <p className="text-xl font-medium italic text-foreground sm:text-2xl">
                "Building the future, one sat at a time."
              </p>
              <footer className="text-sm text-muted-foreground">
                — Open Source Bitcoin Development
              </footer>
            </blockquote>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
