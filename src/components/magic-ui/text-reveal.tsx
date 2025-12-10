"use client"

import { ComponentPropsWithoutRef, FC, ReactNode } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

import { cn } from "@/utils/cn"

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: string
  className?: string
}

export const TextReveal: FC<TextRevealProps> = ({ children, className }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  if (typeof children !== "string") {
    throw new Error("TextReveal: children must be a string")
  }

  const words = children.split(" ")

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <Word key={i} word={word} index={i} isInView={isInView} />
      ))}
    </span>
  )
}

interface WordProps {
  word: string
  index: number
  isInView: boolean
}

const Word: FC<WordProps> = ({ word, index, isInView }) => {
  return (
    <span className="relative mx-1 inline-block">
      <span className="absolute opacity-30">{word}</span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: "easeOut"
        }}
        className="relative text-black dark:text-white"
      >
        {word}
      </motion.span>
    </span>
  )
}

