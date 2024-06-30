import React from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  

export default function FAQ() {
  return (
    <section id="faq" className="py-20 relative z-10">
      <h1 className="heading">
        Frequently Asked 
        <span className="text-purple"> Questions</span>
      </h1>

        <div className='mt-10'>
            <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How do I sign up?</AccordionTrigger>
                        <AccordionContent>
                        Click the 'Select Wallet' button and sign up using your Phantom wallet. Once your wallet is connected, you'll be prompted to complete your profile and can immediately start creating or completing tasks.
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                        <AccordionTrigger>What kind of tasks are available?</AccordionTrigger>
                        <AccordionContent>
                        Tasks range from image labeling to text annotation, and more. Each task type is designed to be simple yet valuable, ensuring a variety of options for users with different skills and interests. You can choose tasks that match your expertise and start earning Solana.
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                        <AccordionTrigger>How do I earn Solana?</AccordionTrigger>
                        <AccordionContent>
                        You earn Solana by completing tasks assigned on the platform. After completing tasks, the Solana rewards are credited to your account, which you can withdraw to your connected Phantom wallet whenever you want.
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Is there a minimum payout threshold?</AccordionTrigger>
                        <AccordionContent>
                        Yes, the minimum payout threshold is 0.5 Solana. Once you reach this amount, you can withdraw your earnings to your wallet.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                        <AccordionTrigger>Are there any fees for using the platform?</AccordionTrigger>
                        <AccordionContent>
                        There are no fees for signing up or completing tasks. However, there may be minimal transaction fees when withdrawing your earnings, which are standard network fees for Solana transactions.
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                        <AccordionTrigger>Can I see my earnings history?</AccordionTrigger>
                        <AccordionContent>
                        Yes, you can view your earnings history in your My Payout section. It provides a detailed summary of the tasks you've completed and the Solana you've earned, allowing you to keep track of your progress and payouts.
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-7">
                        <AccordionTrigger>How do I contact support if I have an issue?</AccordionTrigger>
                        <AccordionContent>
                        If you have any issues or questions, you can contact our support team by emailing us at <b>harsodameet002@gmail.com</b>. We're here to help!
                        </AccordionContent>
                    </AccordionItem>
            </Accordion>
        </div>
    </section>
  )
}



