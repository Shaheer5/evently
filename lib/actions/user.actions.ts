"use server";

import { CreateUserParams, UpdateUserParams } from "@/types";
import { handleError } from "../utils";
import { connectToDatabase } from "../database";
import User from "../database/models/user.model";
import Event from "../database/models/event.model";
import { revalidatePath } from "next/cache";

// create user server action
export const createUser = async (user: CreateUserParams) => {
  try {
    await connectToDatabase();
    const newUser = await User.create(user);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
};

// get user server action
export const getUserById = async (userId: string) => {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found!");
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
};

// update user server action
export const updateUser = async (clerkId: string, user: UpdateUserParams) => {
  try {
    await connectToDatabase();
    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, { new: true });

    if (!updatedUser) throw new Error("User update failed!");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
};

// delete user server action
export const deleteUser = async (clerkId: string) => {
  try {
    await connectToDatabase();

    // find user to delete
    const userToDelete = await User.findOne({ clerkId });
    if (!userToDelete) throw new Error("User not found!");

    // unlink relationships
    await Promise.all([
      // update the 'events' collection to remove the references to the user
      Event.updateMany({ _id: { $in: userToDelete.events } }, { $pull: { organizer: userToDelete._id } }),
      // update the 'orders' collection to remove the references to the user
      Event.updateMany({ _id: { $in: userToDelete.orders } }, { $unset: { buyer: 1 } }),
    ]);

    // delete user
    const deletedUser = await User.findOneAndDelete(userToDelete._id);
    revalidatePath("/");
    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
};
