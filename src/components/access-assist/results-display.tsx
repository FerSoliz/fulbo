"use client";

import Image from "next/image";
import {
  Lightbulb,
  FileText,
  Wrench,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { AIResults } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import imageData from "@/lib/placeholder-images.json";

interface ResultsDisplayProps {
  results: AIResults | null;
  isLoading: boolean;
}

const getPriorityBadge = (priority: number): React.ReactNode => {
  if (priority > 7) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        High Priority
      </Badge>
    );
  }
  if (priority > 4) {
    return (
      <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">
        Medium Priority
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      Low Priority
    </Badge>
  );
};


function InitialState() {
  const { src, hint } = imageData.initialState;
  return (
    <div className="text-center mt-8 p-8 border-2 border-dashed rounded-lg">
       <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
        <Image 
          src={src} 
          alt="Abstract image representing problem solving" 
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint={hint}
          className="opacity-75"
        />
       </div>
      <h3 className="text-xl font-semibold text-foreground">Ready to Assist</h3>
      <p className="mt-2 text-muted-foreground">
        Your troubleshooting guide will appear here once you submit an error.
      </p>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="grid gap-8 animate-pulse">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ResultsDisplay({ results, isLoading }: ResultsDisplayProps) {
  if (isLoading) {
    return <LoadingSkeletons />;
  }

  if (!results) {
    return <InitialState />;
  }

  return (
    <div className="grid gap-8 mt-8">
      <Card className="shadow-lg animate-in fade-in-50 duration-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>
                  Here's a simplified explanation of the error.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90">{results.analysis}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg animate-in fade-in-50 duration-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <CardTitle>Troubleshooting Steps</CardTitle>
              <CardDescription>
                Follow these prioritized steps to resolve the issue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {results.solutions && results.solutions.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {results.solutions.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                      <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
                      <span className="flex-1 font-medium">{item.solution}</span>
                      {getPriorityBadge(item.priority)}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-16 text-muted-foreground">
                    <strong>Rationale:</strong> {item.rationale}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No specific troubleshooting steps could be generated.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg animate-in fade-in-50 duration-1000">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-secondary p-2 rounded-lg">
                <FileText className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  Relevant articles and posts found by our AI.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {results.knowledgeBase && results.knowledgeBase.length > 0 ? (
            <ul className="space-y-3">
              {results.knowledgeBase.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No relevant articles found in the knowledge base.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
