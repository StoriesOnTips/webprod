'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Layers, Palette, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function Features() {
  type ImageKey = 'item-1' | 'item-2' | 'item-3' | 'item-4'
  const [activeItem, setActiveItem] = useState<ImageKey>('item-1')

  const images = {
    'item-1': {
      image: '/landing/imagestyle/pixel2.webp',
      alt: 'Pixel style image',
      title: 'Pixel Style',
      description: 'Immerse yourself in the nostalgic charm of retro-inspired pixel art, perfect for a vibrant and classic aesthetic.',
      icon: Sparkles
    },
    'item-2': {
      image: '/landing/imagestyle/watercolor.webp',
      alt: 'Watercolor painting style image',
      title: 'Watercolor',
      description: 'Experience the elegance of soft, flowing watercolor strokes, blending colors seamlessly for an artistic touch.',
      icon: Palette
    },
    'item-3': {
      image: '/landing/imagestyle/papercut.webp',
      alt: 'Paper cutout style image',
      title: 'Paper Cut',
      description: 'A unique layered paper-cut effect that adds depth and dimension, creating a handcrafted and artistic feel.',
      icon: Layers
    },
    'item-4': {
      image: '/landing/imagestyle/3dcartoon.webp',
      alt: '3D cartoon style image',
      title: '3D Cartoon',
      description: 'Lively and playful, this 3D cartoon style brings characters and scenes to life with bold colors and smooth shading.',
      icon: Zap
    }
  }

  return (
    <section className="py-12 md:py-20 lg:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16 lg:space-y-20">
        <div className="mb-16 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
            <span className="text-sm text-white/80 font-medium">
              Image Styles
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-none mb-6">
            Explore our diverse range of <span>stunning image styles</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed font-light">
            crafted to suit every vision storytelling, creativity, and innovation in mind.
          </p>
        </div>

        <div className="grid gap-12 sm:px-12 md:grid-cols-2 lg:gap-20 lg:px-0">
          <Accordion
            type="single"
            value={activeItem}
            onValueChange={(value) => setActiveItem(value as ImageKey)}
            className="w-full"
          >
            {Object.entries(images).map(([key, item]) => {
              const IconComponent = item.icon;
              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-base">
                      <IconComponent className="size-4" />
                      {item.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {item.description}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          <div className="bg-background relative flex overflow-hidden rounded-3xl border p-2">
            <div className="w-15 absolute inset-0 right-0 ml-auto border-l bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_8px)]"></div>
            <div className="bg-background relative rounded-2xl mx-auto">

              <div
                className="size-full overflow-hidden rounded-2xl border bg-zinc-900 shadow-md mx-auto">
                <Image
                  src={images[activeItem].image}
                  className="size-full object-cover object-left-top dark:mix-blend-lighten mx-auto"
                  alt={images[activeItem].alt}
                  width={929}
                  height={929}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}