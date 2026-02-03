"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateOnboardingStep(step: number) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { onboardingStep: step },
  });

  revalidatePath("/app");
  return { success: true };
}

export async function completeOnboarding() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      onboardingCompleted: true,
      onboardingStep: 5,
    },
  });

  revalidatePath("/app");
  return { success: true };
}

export async function skipOnboarding() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      onboardingSkipped: true,
    },
  });

  revalidatePath("/app");
  return { success: true };
}

export async function restartOnboarding() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      onboardingCompleted: false,
      onboardingStep: 0,
      onboardingSkipped: false,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { success: true };
}

export async function getOnboardingState() {
  const user = await currentUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
      onboardingSkipped: true,
    },
  });

  return dbUser;
}
