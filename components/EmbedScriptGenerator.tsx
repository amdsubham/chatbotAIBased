import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { generateChatWidgetEmbedScript, ChatWidgetEmbedConfig } from '../helpers/chatWidgetEmbedScript';
import { Input } from './Input';
import { Button } from './Button';
import { Textarea } from './Textarea';
import styles from './EmbedScriptGenerator.module.css';

const embedScriptSchema = z.object({
  merchantEmail: z.string().email({ message: 'Please enter a valid email address.' }).min(1, 'Merchant Email is required.'),
  shopName: z.string().optional(),
  shopDomain: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  agentName: z.string().optional(),
  agentImageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  position: z.enum(['bottom-right', 'bottom-left']),
});

type EmbedScriptFormValues = z.infer<typeof embedScriptSchema>;

export const EmbedScriptGenerator = ({ className }: { className?: string }) => {
  const [generatedScript, setGeneratedScript] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<EmbedScriptFormValues>({
    resolver: zodResolver(embedScriptSchema),
    defaultValues: {
      merchantEmail: '',
      shopName: '',
      shopDomain: '',
      primaryColor: '#2563eb',
      agentName: 'Support Bot',
      agentImageUrl: '',
      position: 'bottom-right',
    },
  });

  const formValues = watch();

  useEffect(() => {
    const { merchantEmail, ...rest } = formValues;
    if (embedScriptSchema.safeParse(formValues).success) {
      const config: ChatWidgetEmbedConfig = {
        apiUrl: window.location.origin,
        merchantEmail,
        ...rest,
      };
      setGeneratedScript(generateChatWidgetEmbedScript(config));
    } else {
      setGeneratedScript('// Please fill in the required fields correctly to generate the script.');
    }
  }, [formValues]);

  const handleCopyToClipboard = useCallback(() => {
    if (!generatedScript || generatedScript.startsWith('//')) {
      toast.error('Cannot copy script. Please fix the form errors.');
      return;
    }
    navigator.clipboard.writeText(generatedScript).then(
      () => {
        toast.success('Embed script copied to clipboard!');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        toast.error('Failed to copy script.');
        console.error('Could not copy text: ', err);
      }
    );
  }, [generatedScript]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h2 className={styles.title}>Generate Embed Script</h2>
      <p className={styles.description}>
        Configure the chat widget and generate the script to embed on any website.
      </p>

      <div className={styles.generatorLayout}>
        <form className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="merchantEmail">Merchant Email (Required)</label>
              <Input id="merchantEmail" {...register('merchantEmail')} placeholder="customer@example.com" />
              {errors.merchantEmail && <p className={styles.errorText}>{errors.merchantEmail.message}</p>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="shopName">Shop Name</label>
              <Input id="shopName" {...register('shopName')} placeholder="My Awesome Store" />
            </div>

            <div className={styles.formField}>
              <label htmlFor="shopDomain">Shop Domain</label>
              <Input id="shopDomain" {...register('shopDomain')} placeholder="https://example.com" />
              {errors.shopDomain && <p className={styles.errorText}>{errors.shopDomain.message}</p>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="agentName">Agent Name</label>
              <Input id="agentName" {...register('agentName')} placeholder="Support Bot" />
            </div>

            <div className={styles.formField}>
              <label htmlFor="agentImageUrl">Agent Image URL</label>
              <Input id="agentImageUrl" {...register('agentImageUrl')} placeholder="https://.../avatar.png" />
              {errors.agentImageUrl && <p className={styles.errorText}>{errors.agentImageUrl.message}</p>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="position">Widget Position</label>
              <select id="position" {...register('position')} className={styles.select}>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="primaryColor">Primary Color</label>
              <div className={styles.colorPickerWrapper}>
                <Input id="primaryColor" {...register('primaryColor')} className={styles.colorInput} />
                <input type="color" {...register('primaryColor')} className={styles.colorSwatch} />
              </div>
            </div>
          </div>
        </form>

        <div className={styles.scriptContainer}>
          <div className={styles.scriptHeader}>
            <h3 className={styles.scriptTitle}>Your Embed Script</h3>
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
              {isCopied ? 'Copied!' : 'Copy Script'}
            </Button>
          </div>
          <div className={styles.scriptWrapper}>
            <Textarea
              readOnly
              value={generatedScript}
              className={styles.scriptTextarea}
              disableResize
            />
          </div>
          <div className={styles.instructions}>
            <h4 className={styles.instructionsTitle}>Installation</h4>
            <p>Copy this script and paste it just before the closing <strong><code>&lt;/body&gt;</code></strong> tag on your website.</p>
          </div>
        </div>
      </div>
    </div>
  );
};