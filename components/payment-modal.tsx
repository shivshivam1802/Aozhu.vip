"use client";

import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  ChevronLeft, 
  CreditCard, 
  Lock, 
  QrCode,
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [txHash, setTxHash] = useState("");
  const [senderWallet, setSenderWallet] = useState("");
  const [email, setEmail] = useState("");

  const walletAddress = process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(walletAddress)}`;

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet Address copied to clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    setDownloadingQr(true);
    fetch(qrUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aozhu_payment_qr.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("QR Code downloaded!");
        setDownloadingQr(false);
      })
      .catch(() => {
        toast.error("Failed to download QR code. Opening in new tab instead.");
        window.open(qrUrl, "_blank");
        setDownloadingQr(false);
      });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!txHash.trim()) {
      toast.error("Transaction Hash is required");
      return;
    }

    // TRON Tx Hash validation (64-character hexadecimal string)
    const tronHashRegex = /^[a-fA-F0-9]{64}$/;
    if (!tronHashRegex.test(txHash.trim())) {
      toast.error("Invalid Transaction Hash format. Must be a 64-character hex string.");
      return;
    }

    if (!email.trim()) {
      toast.error("Email Address is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid Email Address");
      return;
    }

    setIsSubmitting(true);

    // Simulate submission latency
    setTimeout(() => {
      try {
        const savedPayments = localStorage.getItem("gaur_premium_payments");
        const payments = savedPayments ? JSON.parse(savedPayments) : [];
        
        const newPayment = {
          id: Date.now().toString(),
          txHash: txHash.trim(),
          senderWallet: senderWallet.trim(),
          email: email.trim().toLowerCase(),
          status: "pending",
          timestamp: new Date().toLocaleString(),
          price: "10 USDT",
          network: "TRON (TRC20)"
        };

        payments.push(newPayment);
        localStorage.setItem("gaur_premium_payments", JSON.stringify(payments));

        // Advance to step 3 (Success)
        setStep(3);
        toast.success("Payment details submitted successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to store payment details. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  const handleClose = () => {
    // Reset state before closing
    setStep(1);
    setTxHash("");
    setSenderWallet("");
    setEmail("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 md:p-8 text-neutral-100 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop decorative */}
        <div className="absolute -top-24 -left-24 -z-10 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 -z-10 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-poppins)] tracking-tight">Unlock Premium</h2>
              <p className="text-xs text-neutral-400">Upgrade your AOZHU experience</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: Details & Scan */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Price badge */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <span className="text-sm font-semibold text-neutral-400">Lifetime Premium Access</span>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-400">10 USDT</span>
                <span className="block text-[10px] text-neutral-500 font-medium">TRON (TRC20) Network</span>
              </div>
            </div>

            {/* QR Code section */}
            <div className="flex flex-col items-center justify-center space-y-3 bg-neutral-950/30 p-4 rounded-xl border border-neutral-800/40">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={qrUrl} 
                  alt="USDT TRC20 Wallet QR Code" 
                  className="h-40 w-40"
                />
              </div>
              <button 
                onClick={handleDownloadQr}
                disabled={downloadingQr}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50"
              >
                {downloadingQr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download QR Code
              </button>
            </div>

            {/* Address copy section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">USDT Recipient Address</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <span className="text-xs font-mono text-indigo-300 select-all truncate flex-grow">
                  {walletAddress}
                </span>
                <button 
                  onClick={handleCopyAddress}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-md bg-neutral-900 border border-neutral-800"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-yellow-500/80 leading-normal flex items-start gap-1">
                ⚠️ Send only **USDT** on the **TRON (TRC20)** network to this address. Sending any other token or using another network may result in permanent loss.
              </p>
            </div>

            {/* Navigation Button */}
            <button 
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20"
            >
              I've Sent Payment <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Proof form */}
        {step === 2 && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white mb-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back to Payment Details
            </button>

            <div className="space-y-1.5">
              <label htmlFor="tx-hash" className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                Transaction Hash (TXID) <span className="text-red-500">*</span>
              </label>
              <input 
                id="tx-hash"
                type="text"
                required
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="e.g. 7c4384bf03a693b769229e614bc47d7e600f72365e8..."
                className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-mono"
              />
              <p className="text-[10px] text-neutral-500 font-sans leading-normal">
                Must be the 64-character TRON transaction identifier.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sender-wallet" className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                Your Wallet Address <span className="text-neutral-500 font-normal">(Optional)</span>
              </label>
              <input 
                id="sender-wallet"
                type="text"
                value={senderWallet}
                onChange={(e) => setSenderWallet(e.target.value)}
                placeholder="Your sender address..."
                className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-email" className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                Your Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                id="user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <p className="text-[10px] text-neutral-500 font-sans leading-normal">
                We'll use this to notify you once your premium access has been verified and activated.
              </p>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting for Review...
                </>
              ) : (
                <>
                  Submit Proof of Payment <CreditCard className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 3 && (
          <div className="text-center py-6 space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20 mb-2 animate-bounce">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-[family-name:var(--font-poppins)] text-neutral-100">Proof Submitted!</h3>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Your payment has been submitted successfully. Your access will be activated after payment verification.
              </p>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl text-left max-w-sm mx-auto space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-neutral-500">Transaction ID:</span> <span className="font-mono text-indigo-300 truncate max-w-[200px]">{txHash}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Target Email:</span> <span className="text-neutral-300">{email}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Verification Time:</span> <span className="text-yellow-500/90 font-medium">Within 2 to 12 hours</span></div>
            </div>
            <button 
              onClick={handleClose}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl transition-colors duration-200"
            >
              Back to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
