"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useUserManagementModal } from "../../hooks/use-userManagementModal";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username/Email is required." }),
  roleId: z.string().min(1, { message: "Please select a role." }),
});

type UserManagementFormValues = z.infer<typeof formSchema>;

export const UserManagementModal = () => {
  const { isOpen, onClose, initialData, roles } = useUserManagementModal();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!initialData;
  const title = isEditMode ? "Update User Role" : "Assign User";
  const description = isEditMode
    ? "Change the role for this user."
    : "Assign an existing user to this business unit by their username/email.";
  const action = isEditMode ? "Save changes" : "Assign";

  const form = useForm<UserManagementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      roleId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        username: initialData.username || "",
        roleId: initialData.roleId,
      });
    } else {
      form.reset({ username: "", roleId: "" });
    }
  }, [initialData, form]);

  const onSubmit = async (data: UserManagementFormValues) => {
    try {
      setLoading(true);
      if (isEditMode && initialData) {
        await axios.patch(
          `/api/${params.businessUnitId}/user-management/${initialData.userId}`,
          data
        );
      } else {
        await axios.post(`/api/${params.businessUnitId}/user-management`, data);
      }
      router.refresh();
      toast.success(
        isEditMode ? "User role updated." : "User assigned successfully."
      );
      onClose();
    } catch (error) {
      toast.error(`Something went wrong. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Username / Email */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (Email)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@example.com"
                      disabled={loading || isEditMode}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Select */}
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {action}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
