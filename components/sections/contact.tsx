"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

import { Terrain } from "@/components/motion/terrain";
import { usePrefersReducedMotion } from "@/components/motion/use-media-query";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem, Stagger } from "@/components/ui/reveal";
import {
  PREFILL_EVENT,
  contactEmail,
  contactEndpoint,
  contactHref,
  requestTypes,
  type ContactPrefill,
  type RequestType,
} from "@/lib/contact";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** What each request type means, so nobody has to guess which one to pick. */
const requestHints: Record<RequestType, string> = {
  Quote: "A defined build, with an estimate before work begins.",
  Proposal: "Ongoing work alongside your team, with priorities set together.",
  Review: "A short look at your system, with the decision answered in writing.",
};

const services = [
  "Web development",
  "Mobile app",
  "Cloud and API engineering",
  "Technical consulting",
  "Not sure yet",
] as const;

type Status = "idle" | "sending" | "sent" | "error";
type FieldName = "name" | "email" | "service" | "message";

const fieldOrder: FieldName[] = ["name", "email", "service", "message"];
const fieldIds: Record<FieldName, string> = {
  name: "contact-name",
  email: "contact-email",
  service: "contact-service",
  message: "contact-message",
};

/** Plain, specific messages: what is wrong and how to fix it. */
const validators: Record<FieldName, (value: string) => string | undefined> = {
  name: (value) => (value.trim() ? undefined : "Enter your name."),
  email: (value) => {
    if (!value.trim()) return "Enter your email so we know where to reply.";
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
      ? undefined
      : "That email looks incomplete. Check it and try again.";
  },
  service: (value) =>
    value ? undefined : "Choose what you need. Not sure yet is a fine answer.",
  message: (value) =>
    value.trim().length >= 10
      ? undefined
      : "Add a few details, at least 10 characters.",
};

const slide = { type: "spring" as const, stiffness: 340, damping: 32, mass: 0.8 };

const errorColor = "text-[#a3564f]";

const fieldClass =
  "block w-full rounded-lg border border-border-strong bg-background px-4 text-base text-foreground outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-out placeholder:text-muted-subtle hover:border-muted-subtle focus:border-accent focus:bg-surface-elevated focus:ring-4 focus:ring-accent/15";

const errorBorder = "border-[#a3564f]";

export function Contact() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [status, setStatus] = React.useState<Status>("idle");
  const [requestType, setRequestType] = React.useState<RequestType>("Quote");
  const [service, setService] = React.useState("");
  const [errors, setErrors] = React.useState<
    Partial<Record<FieldName, string>>
  >({});
  const [sentTo, setSentTo] = React.useState("");

  // Engagement cards pre-select the form before scrolling to it.
  React.useEffect(() => {
    function handlePrefill(event: Event) {
      const { requestType: nextType, service: nextService } = (
        event as CustomEvent<ContactPrefill>
      ).detail;

      if (nextType && requestTypes.includes(nextType)) setRequestType(nextType);
      // The card sets the whole selection, so a service chosen by an earlier card does not linger.
      setService(
        nextService && (services as readonly string[]).includes(nextService)
          ? nextService
          : "",
      );
      setErrors((current) => ({ ...current, service: undefined }));
      // A visitor who already sent a request gets a fresh form.
      setStatus((current) => (current === "sent" ? "idle" : current));
    }

    window.addEventListener(PREFILL_EVENT, handlePrefill);
    return () => window.removeEventListener(PREFILL_EVENT, handlePrefill);
  }, []);

  /** Check one field and show or clear its message. */
  function check(name: FieldName, value: string) {
    setErrors((current) => ({ ...current, [name]: validators[name](value) }));
  }

  /** Once a field has an error, clear it the moment it becomes valid. */
  function recheck(name: FieldName, value: string) {
    if (errors[name]) check(name, value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const data = new FormData(event.currentTarget);

    // Honeypot: real visitors never see or fill this field.
    if (data.get("_honey")) {
      setSentTo("");
      setStatus("sent");
      return;
    }

    const values: Record<FieldName, string> = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      service: String(data.get("service") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    const found: Partial<Record<FieldName, string>> = {};
    fieldOrder.forEach((name) => {
      found[name] = validators[name](values[name]);
    });
    setErrors(found);

    // Take the visitor straight to the first thing to fix.
    const firstProblem = fieldOrder.find((name) => found[name]);
    if (firstProblem) {
      // A new attempt clears an earlier "did not send" message instead of stacking on it.
      setStatus((current) => (current === "error" ? "idle" : current));
      document.getElementById(fieldIds[firstProblem])?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(contactEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company") || "Not provided",
          request_type: requestType,
          service: data.get("service"),
          message: data.get("message"),
          _subject: `New ${requestType.toLowerCase()} request from ${data.get("name")} via root-path.tech`,
          _replyto: data.get("email"),
          _template: "table",
          _captcha: "false",
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean | string;
      } | null;

      if (!response.ok || (result && String(result.success) === "false")) {
        throw new Error("Request failed");
      }
      setSentTo(values.email.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative isolate mx-auto max-w-7xl border-t border-border px-6 py-20 sm:py-24 lg:px-10 lg:py-28"
    >
      {/* Contours in the corner under the intro column, clear of the form. */}
      <Terrain
        className="-z-10 left-1/2 right-auto w-screen -translate-x-1/2"
        fade="radial-gradient(ellipse 45% 60% at 0% 100%, #000 10%, transparent 80%)"
        opacity={0.1}
        flip
      />
      <div className="grid gap-12 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)] lg:gap-20">
        <Reveal className="self-start lg:sticky lg:top-28">
          <p className="eyebrow">04 · Contact</p>
          <h2
            id="contact-heading"
            className="mt-5 max-w-xl text-4xl font-medium leading-[1] tracking-[-0.03em] text-foreground sm:text-5xl"
          >
            Tell us what you are building.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Ask for a quote, a full proposal or a review. Share the problem, the timeline,
            and anything that is already in place. Your request goes straight to
            the team that would do the work.
          </p>

          <dl className="mt-8 grid gap-5 border-t border-border pt-6 text-sm">
            <div>
              <dt className="font-medium text-foreground">Prefer email?</dt>
              <dd className="mt-1">
                <a
                  href={contactHref}
                  className="rounded-sm text-accent underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  {contactEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">What happens next</dt>
              <dd className="mt-1 leading-6 text-muted-foreground">
                We read every request and reply with questions or a scoped plan.
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.08} amount={0.1}>
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-[0_30px_60px_-40px_rgb(var(--accent-rgb)/0.35)] sm:p-8 lg:p-10">
            <AnimatePresence mode="wait" initial={false}>
              {status === "sent" ? (
                <motion.div
                  key="sent"
                  role="status"
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, transform: "translateY(10px)" }
                  }
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.45, ease }}
                  className="py-8 sm:py-14"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <motion.path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        initial={shouldReduceMotion ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.15, ease }}
                      />
                    </svg>
                  </span>
                  <h3 className="mt-6 text-3xl font-medium tracking-[-0.02em] text-foreground">
                    Request received.
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
                    Thanks for the details. We will read them and reply to{" "}
                    {sentTo ? (
                      <span className="font-medium text-foreground">
                        {sentTo}
                      </span>
                    ) : (
                      "the email address you provided"
                    )}
                    .
                  </p>
                  <Button
                    variant="outline"
                    className="mt-8"
                    onClick={() => {
                      setErrors({});
                      setStatus("idle");
                    }}
                  >
                    Send another request
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate
                  aria-describedby="contact-status"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Stagger
                    amount={0.1}
                    className="grid gap-x-6 gap-y-6 sm:grid-cols-2"
                  >
                    <RevealItem className="sm:col-span-2">
                      <fieldset>
                        <legend className="mb-2 text-sm font-medium text-foreground">
                          What would you like?
                        </legend>
                        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border-strong bg-background p-1 sm:inline-grid sm:min-w-[22rem]">
                          {requestTypes.map((type) => {
                            const selected = requestType === type;
                            return (
                              <label
                                key={type}
                                className="relative min-h-11 cursor-pointer rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.97] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70"
                              >
                                <input
                                  type="radio"
                                  name="request_type"
                                  value={type}
                                  checked={selected}
                                  onChange={() => setRequestType(type)}
                                  className="sr-only"
                                />
                                {selected ? (
                                  <motion.span
                                    layoutId="request-pill"
                                    transition={slide}
                                    aria-hidden="true"
                                    className="absolute inset-0 rounded-lg bg-accent"
                                  />
                                ) : null}
                                <span
                                  className={cn(
                                    "relative transition-colors duration-200 ease-out",
                                    selected
                                      ? "text-accent-foreground"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {type}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <motion.p
                          key={requestType}
                          initial={
                            shouldReduceMotion ? false : { opacity: 0 }
                          }
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          aria-live="polite"
                          className="mt-3 text-sm leading-6 text-muted-foreground"
                        >
                          {requestHints[requestType]}
                        </motion.p>
                      </fieldset>
                    </RevealItem>

                    <Field id={fieldIds.name} label="Name" error={errors.name}>
                      <input
                        id={fieldIds.name}
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Your name"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                          errors.name ? `${fieldIds.name}-error` : undefined
                        }
                        onBlur={(event) => check("name", event.target.value)}
                        onInput={(event) =>
                          recheck("name", event.currentTarget.value)
                        }
                        className={cn(
                          fieldClass,
                          "h-12",
                          errors.name && errorBorder,
                        )}
                      />
                    </Field>

                    <Field id={fieldIds.email} label="Email" error={errors.email}>
                      <input
                        id={fieldIds.email}
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@company.com"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? `${fieldIds.email}-error` : undefined
                        }
                        onBlur={(event) => check("email", event.target.value)}
                        onInput={(event) =>
                          recheck("email", event.currentTarget.value)
                        }
                        className={cn(
                          fieldClass,
                          "h-12",
                          errors.email && errorBorder,
                        )}
                      />
                    </Field>

                    <Field id="contact-company" label="Company" optional>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        placeholder="Company name"
                        className={cn(fieldClass, "h-12")}
                      />
                    </Field>

                    <Field
                      id={fieldIds.service}
                      label="What do you need"
                      error={errors.service}
                    >
                      <div className="relative">
                        <select
                          id={fieldIds.service}
                          name="service"
                          required
                          value={service}
                          aria-invalid={Boolean(errors.service)}
                          aria-describedby={
                            errors.service
                              ? `${fieldIds.service}-error`
                              : undefined
                          }
                          onChange={(event) => {
                            setService(event.target.value);
                            check("service", event.target.value);
                          }}
                          className={cn(
                            fieldClass,
                            "h-12 cursor-pointer appearance-none pr-11",
                            service === "" && "text-muted-subtle",
                            errors.service && errorBorder,
                          )}
                        >
                          <option value="" disabled>
                            Select a service
                          </option>
                          {services.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <svg
                          viewBox="0 0 16 16"
                          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.75}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M4 6.5l4 4 4-4" />
                        </svg>
                      </div>
                    </Field>

                    <Field
                      id={fieldIds.message}
                      label="Project details"
                      error={errors.message}
                      className="sm:col-span-2"
                    >
                      <textarea
                        id={fieldIds.message}
                        name="message"
                        required
                        rows={5}
                        placeholder="What are you building, what is the timeline, and what is already in place?"
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={
                          errors.message ? `${fieldIds.message}-error` : undefined
                        }
                        onBlur={(event) => check("message", event.target.value)}
                        onInput={(event) =>
                          recheck("message", event.currentTarget.value)
                        }
                        className={cn(
                          fieldClass,
                          "min-h-[9rem] resize-y py-3 leading-7",
                          errors.message && errorBorder,
                        )}
                      />
                    </Field>

                    {/* Honeypot, hidden from people and assistive tech. */}
                    <div
                      aria-hidden="true"
                      className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                    >
                      <label htmlFor="contact-honey">
                        Leave this field empty
                      </label>
                      <input
                        id="contact-honey"
                        name="_honey"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <RevealItem className="sm:col-span-2">
                      <div className="flex flex-col-reverse gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <p
                          id="contact-status"
                          role="status"
                          aria-live="polite"
                          className={cn(
                            "max-w-xs text-sm leading-6",
                            status === "error"
                              ? errorColor
                              : "text-muted-foreground",
                          )}
                        >
                          {status === "error" ? (
                            <>
                              That did not send. Try again, or email{" "}
                              <a
                                href={contactHref}
                                className="underline underline-offset-4"
                              >
                                {contactEmail}
                              </a>
                              .
                            </>
                          ) : (
                            "We use your details only to reply to this request."
                          )}
                        </p>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={status === "sending"}
                          className="w-full sm:w-auto"
                        >
                          {status === "sending" ? (
                            <>
                              <span
                                aria-hidden="true"
                                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                              />
                              Sending
                            </>
                          ) : (
                            <>
                              Request a {requestType.toLowerCase()}
                              <span
                                aria-hidden="true"
                                className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1"
                              >
                                →
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    </RevealItem>
                  </Stagger>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** A readable label above the field and, when needed, a specific message below it. */
function Field({ id, label, optional, error, className, children }: FieldProps) {
  return (
    <RevealItem className={className}>
      <label
        htmlFor={id}
        className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium text-foreground"
      >
        <span>{label}</span>
        {optional ? (
          <span className="text-xs font-normal text-muted-subtle">Optional</span>
        ) : null}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, transform: "translateY(-4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className={cn("mt-2 text-sm leading-5", errorColor)}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </RevealItem>
  );
}
