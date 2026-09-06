import { useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CircularProgress, Typography } from "@mui/material";
import { User, Mail, Phone, Lock, UserPlus } from "lucide-react";
import TicketDialog from "./TicketDialog";
import TicketField from "./form/TicketField";
import ShimmerButton from "./ShimmerButton";
import { createOwner } from "../api/owners";
import { selectToken } from "../store/authSlice";
import { ownerSchema } from "../lib/registrationSchemas";
import { validateWithSchema } from "../lib/authSchemas";

const EMPTY = { name: "", email: "", phone: "", password: "" };

const FIELDS = [
  {
    name: "name",
    label: "Full name",
    icon: User,
    placeholder: "Aisha Khan",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    icon: Mail,
    type: "email",
    placeholder: "owner@shop.com",
    autoComplete: "off",
  },
  {
    name: "phone",
    label: "Phone",
    icon: Phone,
    type: "tel",
    placeholder: "9876543210",
    inputMode: "tel",
  },
  {
    name: "password",
    label: "Initial password",
    icon: Lock,
    type: "password",
    placeholder: "At least 6 characters",
  },
];

export default function RegisterOwnerDialog({ open, onClose, onCreated }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [shakes, setShakes] = useState({});
  const [formError, setFormError] = useState(null);

  const mutation = useMutation({
    mutationFn: (body) => createOwner(body, token),
    onSuccess: (owner) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      resetForm();
      onClose(); // close directly — handleClose's in-flight guard would block this
      onCreated?.(owner);
    },
    onError: (err) =>
      setFormError(err.message || "Could not register owner. Try again."),
  });

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    if (formError) setFormError(null);
  }

  function resetForm() {
    setValues(EMPTY);
    setErrors({});
    setFormError(null);
  }

  // User-initiated close (X / backdrop / Escape): ignored while a submit is in flight.
  function handleClose() {
    if (mutation.isPending) return;
    resetForm();
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mutation.isPending) return;

    const nextErrors = validateWithSchema(ownerSchema, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setShakes((prev) => {
        const next = { ...prev };
        for (const name of Object.keys(nextErrors))
          next[name] = (next[name] ?? 0) + 1;
        return next;
      });
      return;
    }

    setFormError(null);
    mutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
      password: values.password,
    });
  }

  return (
    <TicketDialog
      open={open}
      onClose={handleClose}
      icon={UserPlus}
      title="Register Shop Owner"
      subtitle="They’ll sign in with this email + password."
    >
      <form onSubmit={handleSubmit} noValidate>
        {FIELDS.map((f) => (
          <TicketField
            key={f.name}
            {...f}
            value={values[f.name]}
            error={errors[f.name]}
            shakeSignal={shakes[f.name] ?? 0}
            onChange={handleChange}
          />
        ))}

        {formError && (
          <Typography
            component={motion.p}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              mb: 1,
              textAlign: "center",
              fontSize: 14,
              fontWeight: 500,
              color: "error.main",
            }}
          >
            {formError}
          </Typography>
        )}

        <ShimmerButton
          type="submit"
          disabled={mutation.isPending}
          className="mt-1 w-full text-[15px]"
        >
          {mutation.isPending ? (
            <>
              <CircularProgress size={16} sx={{ color: "#241A14" }} />
              Registering…
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Register Owner
            </>
          )}
        </ShimmerButton>
      </form>
    </TicketDialog>
  );
}
