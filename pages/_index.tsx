import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "../components/Button";
import { ChatWidget } from "../components/ChatWidget";
import { ArrowRight, Bot, Users, Database, Zap, Code, Copy, Check, ExternalLink, Download } from "lucide-react";
import styles from "./_index.module.css";

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className={styles.featureCard}>
    <div className={styles.featureIcon}>{icon}</div>
    <h3 className={styles.featureTitle}>{title}</h3>
    <p className={styles.featureDescription}>{description}</p>
  </div>
);

const StepCard = ({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) => (
  <div className={styles.stepCard}>
    <div className={styles.stepNumber}>{step}</div>
    <h3 className={styles.stepTitle}>{title}</h3>
    <p className={styles.stepDescription}>{description}</p>
  </div>
);

const IndexPage = () => {
  const [copied, setCopied] = useState(false);

  const integrationCode = `<script src="https://primecaves-chatbot.floot.app/_api/widget-sdk"></script>
<script>
  PrimeCavesChatWidget.init({
    merchantEmail: 'user@example.com',
    shopName: 'My Shop',
    shopDomain: 'myshop.myshopify.com',
    primaryColor: '#6366f1'
  });
</script>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(integrationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const scrollToIntegration = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("integration");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Universal AI Support Chatbot | Floot</title>
        <meta
          name="description"
          content="Automate error debugging and customer support with our intelligent AI chatbot. Seamlessly escalate to human agents when needed."
        />
      </Helmet>
      <div className={styles.pageWrapper}>
        <main className={styles.mainContent}>
          {/* Hero Section */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroHeadline}>
                Universal AI Support Chatbot
              </h1>
              <p className={styles.heroTagline}>
                Automatically debug errors and provide instant customer support.
                Our AI-powered chatbot resolves issues fast and escalates to
                human agents seamlessly when needed.
              </p>
              <div className={styles.heroActions}>
                <Button size="lg" asChild>
                  <Link to="/admin">View Admin Panel</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#integration" onClick={scrollToIntegration}>
                    Try Demo <ArrowRight size={20} />
                  </a>
                </Button>
              </div>
            </div>
            <div className={styles.heroImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="AI Support Dashboard"
                className={styles.heroImage}
              />
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className={styles.featuresSection}>
            <h2 className={styles.sectionTitle}>Powerful Features, Effortless Support</h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to automate support and delight your users.
            </p>
            <div className={styles.featuresGrid}>
              <FeatureCard
                icon={<Bot size={24} />}
                title="AI-Powered Debugging"
                description="Automatically detects errors, analyzes context, and provides instant, actionable solutions to users."
              />
              <FeatureCard
                icon={<Users size={24} />}
                title="Seamless Human Escalation"
                description="If the AI can't solve the issue, the conversation is smoothly handed off to a live support agent."
              />
              <FeatureCard
                icon={<Database size={24} />}
                title="Self-Learning Knowledge Base"
                description="The system learns from every interaction and allows admins to manage a Q&A database to improve AI accuracy."
              />
              <FeatureCard
                icon={<Zap size={24} />}
                title="Full Chat History & Analytics"
                description="Access complete conversation logs and gain insights from the admin panel to track performance."
              />
              <FeatureCard
                icon={<Code size={24} />}
                title="Easy Integration"
                description="Simply drop our lightweight widget into any dashboard or page to get started in minutes."
              />
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className={styles.howItWorksSection}>
            <h2 className={styles.sectionTitle}>Get Started in 3 Simple Steps</h2>
            <p className={styles.sectionSubtitle}>
              A streamlined process from problem to resolution.
            </p>
            <div className={styles.stepsContainer}>
              <StepCard
                step="01"
                title="Trigger the Widget"
                description="The support chatbot appears automatically when an error occurs or can be triggered manually by the user."
              />
              <div className={styles.stepConnector}></div>
              <StepCard
                step="02"
                title="AI Analyzes & Solves"
                description="The AI assistant takes the error context, consults the knowledge base, and suggests a solution."
              />
              <div className={styles.stepConnector}></div>
              <StepCard
                step="03"
                title="Escalate if Needed"
                description="If the user isn't satisfied, they can instantly request to chat with a human agent for further assistance."
              />
            </div>
          </section>

          {/* Integration Section */}
          <section id="integration" className={styles.integrationSection}>
            <h2 className={styles.sectionTitle}>Install in Minutes</h2>
            <p className={styles.sectionSubtitle}>
              Copy and paste this code into any website. Works with React, Vue, Shopify, WordPress, or plain HTML.
            </p>
            <div className={styles.codeBlockContainer}>
              <div className={styles.codeBlockHeader}>
                <span className={styles.codeBlockTitle}>integration.html</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className={styles.copyButton}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className={styles.codeBlock}>
                <code className={styles.codeContent}>{integrationCode}</code>
              </pre>
            </div>
            <div className={styles.integrationFooter}>
              <Button variant="outline" asChild>
                <a href="/_api/demo-html" download>
                  <Download size={18} />
                  Download Demo
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/INTEGRATION_GUIDE.txt" target="_blank" rel="noopener noreferrer">
                  View Full Integration Guide
                  <ExternalLink size={18} />
                </a>
              </Button>
            </div>
          </section>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Ready to Revolutionize Your Support?</h2>
              <p className={styles.ctaText}>
                Explore the powerful admin dashboard and see how our AI chatbot can
                transform your user support experience.
              </p>
              <div className={styles.ctaActions}>
                <Button size="lg" asChild>
                  <Link to="/admin">View Admin Panel</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
        <ChatWidget 
          config={{
            primaryColor: '#6366f1',
            agentName: 'Subham Routray',
            agentImageUrl: 'https://allinonelabels.s3.ap-southeast-2.amazonaws.com/images/SubhamR.png',
            widgetPosition: 'bottom-right',
            merchantEmail: 'demo@example.com',
            shopName: 'Demo Shop',
            shopDomain: 'demo.example.com',
            hideContactForm: true
          }}
        />
      </div>
    </>
  );
};

export default IndexPage;