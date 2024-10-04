import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const exampleMessages = [
  {
    heading: '什么是人工智能?',
    message: '什么是人工智能?'
  },
  {
    heading: '关于福州的有趣事情?',
    message: '关于福州的有趣事情?'
  },
  {
    heading: '介绍马斯克的SpaceX计划',
    message: '介绍马斯克的SpaceX计划'
  },
  {
    heading: '乔布斯说的 `Real artists ship` 是什么意思?',
    message: '乔布斯说的 `Real artists ship` 是什么意思?'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
