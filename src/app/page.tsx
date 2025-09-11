"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getTroubleshootingInfo } from "@/app/actions";
import { AIResults } from "@/lib/types";
import { Logo } from "@/components/access-assist/logo";
import { ResultsDisplay } from "@/components/access-assist/results-display";

const FormSchema = z.object({
  errorMessage: z
    .string()
    .min(10, {
      message: "Please enter at least 10 characters to analyze.",
    })
    .max(4000, {
      message: "Error message must not be longer than 4000 characters.",
    }),
});

export default function Home() {
  const { toast } = useToast();
  const [results, setResults] = React.useState<AIResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      errorMessage: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResults(null);
    try {
      const resultData = await getTroubleshootingInfo(data.errorMessage);
      setResults(resultData);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description:
          "Failed to get troubleshooting information. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4">
          <Logo />
          <h1 className="text-xl font-semibold text-foreground">
            Access Assist
          </h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Stuck on an Error?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Paste your error message or describe the problem below. Our AI
              will analyze it and provide you with guided troubleshooting steps.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="errorMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Error Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Permission denied while trying to access /data/db.'"
                          className="min-h-[140px] resize-none rounded-lg p-4 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="sr-only">
                        Enter the error message or describe your access issue.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="w-full max-w-xs"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Analyzing..." : "Get Help"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          <div className="mx-auto mt-12 max-w-4xl">
             <ResultsDisplay results={results} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
