import React, { useState } from 'react';
import { Check, X, Star } from 'lucide-react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('yearly');
  
  const plans = [
    {
      name: 'Rookie',
      price: billingCycle === 'yearly' ? 49 : 59,
      originalPrice: billingCycle === 'yearly' ? 59 : null,
      billing: 'Billed yearly',
      subtext: 'Tax deductible*',
      transactions: 100,
      accountIntegrations: 'Unlimited',
      features: [
        { name: 'Portfolio tracking', included: true },
        { name: 'Unlimited HMRC Tax Reports (ALL tax years)', included: true },
        { name: 'Automated on-chain transactions', included: false },
        { name: 'Smart contract interactions', included: false },
        { name: 'Tax minimisation algorithm', included: false },
        { name: 'Advanced tax reports', included: false },
        { name: 'Tax-loss harvesting tool', included: false },
        { name: 'Audit report', included: false }
      ],
      support: 'Email + chat support',
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Hobbyist',
      price: billingCycle === 'yearly' ? 99 : 119,
      originalPrice: billingCycle === 'yearly' ? 119 : null,
      billing: 'Billed yearly',
      subtext: 'Tax deductible*',
      transactions: 1000,
      accountIntegrations: 'Unlimited',
      features: [
        { name: 'Portfolio tracking', included: true },
        { name: 'Unlimited HMRC Tax Reports (ALL tax years)', included: true },
        { name: 'Automated on-chain transactions', included: false },
        { name: 'Smart contract interactions', included: true },
        { name: 'Tax minimisation algorithm', included: false },
        { name: 'Advanced tax reports', included: false },
        { name: 'Tax-loss harvesting tool', included: false },
        { name: 'Audit report', included: false }
      ],
      support: 'Email + chat support',
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Investor',
      price: billingCycle === 'yearly' ? 249 : 299,
      originalPrice: billingCycle === 'yearly' ? 299 : null,
      billing: 'Billed yearly',
      subtext: 'Tax deductible*',
      transactions: 10000,
      accountIntegrations: 'Unlimited',
      features: [
        { name: 'Portfolio tracking', included: true },
        { name: 'Unlimited HMRC Tax Reports (ALL tax years)', included: true },
        { name: 'Automated on-chain transactions', included: true },
        { name: 'Smart contract interactions', included: true },
        { name: 'Tax minimisation algorithm', included: true },
        { name: 'Advanced tax reports', included: true },
        { name: 'Tax-loss harvesting tool', included: true },
        { name: 'Audit report', included: true }
      ],
      support: 'Email + chat support',
      cta: 'Buy Investor',
      popular: true
    },
    {
      name: 'Trader',
      price: billingCycle === 'yearly' ? 499 : 599,
      originalPrice: billingCycle === 'yearly' ? 599 : null,
      billing: 'Billed yearly',
      subtext: 'Tax deductible*',
      transactions: 100000,
      accountIntegrations: 'Unlimited',
      features: [
        { name: 'Portfolio tracking', included: true },
        { name: 'Unlimited HMRC Tax Reports (ALL tax years)', included: true },
        { name: 'Automated on-chain transactions', included: true },
        { name: 'Smart contract interactions', included: true },
        { name: 'Tax minimisation algorithm', included: true },
        { name: 'Advanced tax reports', included: true },
        { name: 'Tax-loss harvesting tool', included: true },
        { name: 'Audit report', included: true }
      ],
      support: 'Priority support',
      cta: 'Buy Trader',
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How is crypto tax calculated?",
      answer: "You can be liable for both capital gains and income tax depending on the type of cryptocurrency transaction, and your individual circumstances. For example, you might need to pay capital gains on profits from buying and selling cryptocurrency, or pay income tax on interest earned when holding crypto."
    },
    {
      question: "I lost money trading cryptocurrency. Do I still pay tax?",
      answer: "The way cryptocurrencies are taxed in most countries mean that investors might still need to pay tax, regardless of if they made an overall profit or loss. Depending on your circumstances, taxes are usually realised at the time of the transaction, and not on the overall position at the end of the financial year."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose your plan</h1>
          <p className="text-lg text-gray-600 mb-2">
            Pay the lowest tax and get the most accurate reports with TaxFolio.
          </p>
          <p className="text-sm text-gray-500">
            You have 1374 billable transactions ⓘ
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8 mb-8">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'yearly' ? 'monthly' : 'yearly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`ml-3 ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>Yearly</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 relative ${
                plan.popular ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">£{plan.price}.00</span>
                  {plan.originalPrice && (
                    <span className="text-lg text-gray-500 line-through ml-2">£{plan.originalPrice}.00</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{plan.billing}</p>
                <p className="text-sm text-gray-500">{plan.subtext}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transactions</span>
                  <span className="font-medium">{plan.transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Integrations</span>
                  <span className="font-medium">{plan.accountIntegrations}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Support</span>
                  <span className="text-sm font-medium">{plan.support}</span>
                </div>
              </div>

              <button
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">30-day money back guarantee</p>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div className="text-center mb-12">
          <p className="text-gray-600 mb-4">Works with</p>
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="text-sm font-medium">TurboTax</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
              <span className="text-sm font-medium">TaxAct</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
              <span className="text-sm font-medium">H&R BLOCK</span>
            </div>
          </div>
          <div className="flex items-center justify-center mt-4">
            <Star className="w-5 h-5 text-green-500 fill-current" />
            <span className="ml-1 text-sm font-medium text-gray-700">4.8/5 TrustPilot</span>
          </div>
        </div>

        {/* Business Links */}
        <div className="flex justify-center space-x-8 mb-12">
          <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
            View business plan →
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
            View accountant plan →
          </a>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently asked questions</h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {String(index + 1).padStart(2, '0')}. {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          *All plans may be tax-deductible when incurred as an expense related to managing your own tax affairs.
        </div>
      </div>
    </div>
  );
};

export default PricingPage;