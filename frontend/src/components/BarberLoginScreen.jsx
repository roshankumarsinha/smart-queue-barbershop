import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import {
  Mail,
  Lock,
  Phone,
  KeyRound,
  Scissors,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { ROLES, LOGIN_ROLE_ORDER, getRole } from "../config/roles";
import { loginStart, loginSuccess, loginFailure } from "../store/authSlice";
import { login } from "../api/auth";
import { schemaForAuthMethod, validateWithSchema } from "../lib/authSchemas";
import BarberPole from "./BarberPole";
import ShimmerButton from "./ShimmerButton";

// --- Field definitions per auth method ---------------------------------------
const FIELDS = {
  email: [
    {
      name: "email",
      label: "Email",
      type: "email",
      icon: Mail,
      placeholder: "you@shop.com",
      autoComplete: "email",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      icon: Lock,
      placeholder: "••••••••",
      autoComplete: "current-password",
    },
  ],
  phone: [
    {
      name: "phone",
      label: "Phone number",
      type: "tel",
      icon: Phone,
      placeholder: "9876543210",
      inputMode: "numeric",
      autoComplete: "tel",
    },
    {
      name: "pin",
      label: "4-digit PIN",
      type: "password",
      icon: KeyRound,
      placeholder: "••••",
      inputMode: "numeric",
      maxLength: 4,
      autoComplete: "off",
    },
  ],
};

// --- A single MUI field that shakes on invalid submit ------------------------
function FormField({ field, value, error, shakeSignal, onChange }) {
  const controls = useAnimationControls();
  const Icon = field.icon;

  // Secret fields (password / PIN) get a reveal toggle. `revealed` swaps the
  // input type between "password" and "text"; other fields keep their own type.
  const isSecret = field.type === "password";
  const [revealed, setRevealed] = useState(false);
  const RevealIcon = revealed ? EyeOff : Eye;
  const inputType = isSecret ? (revealed ? "text" : "password") : field.type;

  // Re-run the shake on every invalid submit (shakeSignal increments), not just
  // when the field first enters an error state.
  useEffect(() => {
    if (shakeSignal > 0) {
      controls.start({
        x: [0, -6, 6, -4, 4, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }
  }, [shakeSignal, controls]);

  return (
    <motion.div animate={controls}>
      <Typography
        component="label"
        htmlFor={field.name}
        sx={{
          display: "block",
          mb: 0.5,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "text.secondary",
        }}
      >
        {field.label}
      </Typography>
      <TextField
        id={field.name}
        name={field.name}
        type={inputType}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        placeholder={field.placeholder}
        error={!!error}
        helperText={error ?? " "}
        fullWidth
        hiddenLabel
        variant="filled"
        autoComplete={field.autoComplete}
        slotProps={{
          input: {
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <Icon size={16} className="text-ink-muted" aria-hidden="true" />
              </InputAdornment>
            ),
            endAdornment: isSecret ? (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? "Hide password" : "Show password"}
                  aria-pressed={revealed}
                  edge="end"
                  disableRipple
                  component={motion.button}
                  whileTap={{ scale: 0.85 }}
                  sx={{
                    width: 44,
                    height: 44,
                    color: "#6B5D4F", // ink-muted
                    transition: "color 150ms",
                    "&:hover": { color: "#A67C2E", bgcolor: "transparent" }, // brass-dark
                  }}
                >
                  {/* Eye <-> EyeOff swap with a quick vertical flip. */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={revealed ? "off" : "on"}
                      initial={{ opacity: 0, rotateX: -90, scale: 0.6 }}
                      animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                      exit={{ opacity: 0, rotateX: 90, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      style={{ display: "inline-flex" }}
                    >
                      <RevealIcon size={18} aria-hidden="true" />
                    </motion.span>
                  </AnimatePresence>
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
          htmlInput: {
            inputMode: field.inputMode,
            maxLength: field.maxLength,
            "aria-invalid": !!error,
          },
        }}
        sx={{
          "& .MuiFilledInput-root": {
            bgcolor: "#E7DDC9", // ivory-dim
            borderRadius: 2,
            transition: "box-shadow 150ms",
            "&:hover": { bgcolor: "#E7DDC9" },
            "&.Mui-focused": {
              bgcolor: "#E7DDC9",
              boxShadow: "0 0 0 2px #C89B3C", // brass focus ring
            },
            "&.Mui-error": { boxShadow: "0 0 0 2px #B23A32" },
          },
          "& .MuiFilledInput-input": { color: "#241A14" }, // ink
        }}
      />
    </motion.div>
  );
}

// --- Ticket "perforation" divider with punched side notches ------------------
function Perforation() {
  return (
    <Box sx={{ position: "relative", py: 0.5 }}>
      {/* bg-charcoal circles centered on the card edges read as punched holes */}
      <Box
        className="bg-charcoal"
        sx={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: 20,
          height: 20,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
        }}
      />
      <Box
        className="bg-charcoal"
        sx={{
          position: "absolute",
          right: 0,
          top: "50%",
          width: 20,
          height: 20,
          transform: "translate(50%, -50%)",
          borderRadius: "50%",
        }}
      />
      <Box
        sx={{
          mx: 2,
          borderTop: "2px dashed",
          borderColor: "rgba(107,93,79,0.3)",
        }}
      />
    </Box>
  );
}

// --- The login screen --------------------------------------------------------
export default function BarberLoginScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeRoleKey, setActiveRoleKey] = useState(LOGIN_ROLE_ORDER[0]);
  const [values, setValues] = useState({
    email: "",
    password: "",
    phone: "",
    pin: "",
  });
  const [errors, setErrors] = useState({});
  const [shakes, setShakes] = useState({}); // field -> incrementing signal
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const role = getRole(activeRoleKey);
  const fields = FIELDS[role.authMethod];
  const activeIndex = LOGIN_ROLE_ORDER.indexOf(activeRoleKey);

  function handleRoleChange(index) {
    const key = LOGIN_ROLE_ORDER[index];
    if (key === activeRoleKey) return;
    setActiveRoleKey(key);
    setErrors({});
    setFormError(null);
  }

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    // Validate only the fields for the active auth method, via zod.
    const schema = schemaForAuthMethod(role.authMethod);
    const subset = Object.fromEntries(
      fields.map((f) => [f.name, values[f.name]]),
    );
    const nextErrors = validateWithSchema(schema, subset);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setShakes((prev) => {
        const next = { ...prev };
        for (const name of Object.keys(nextErrors)) {
          next[name] = (next[name] ?? 0) + 1;
        }
        return next;
      });
      return;
    }

    // --- Real login against the NestJS backend --------------------------------
    // POST /api/auth/login -> { user, role, token } (see src/api/auth.js).
    setFormError(null);
    setSubmitting(true);
    dispatch(loginStart());

    const credentials =
      role.authMethod === "email"
        ? { email: values.email, password: values.password }
        : { phone: values.phone, pin: values.pin };

    console.log("Logging in with credentials:", credentials);
    console.log("RoleKey:", activeRoleKey, "Role path:", role.path);

    login({ roleKey: activeRoleKey, credentials })
      .then((result) => {
        dispatch(loginSuccess(result));
        navigate(role.path);
      })
      .catch((err) => {
        dispatch(loginFailure(err.message));
        setFormError(err.message || "Something went wrong. Try again.");
        setSubmitting(false);
      });
  }

  return (
    // On phones the card fills the whole screen (edge-to-edge ivory, no charcoal
    // margins); from `sm` up it becomes the floating ticket-stub.
    <div className="flex flex-1 flex-col items-stretch sm:items-center sm:justify-center sm:px-4 sm:py-8">
      {/* Ticket-stub card (MUI Paper) — fades + slides up on mount. Non-blocking:
          framer-motion animations don't intercept pointer events, so the submit
          button is clickable immediately. */}
      <Paper
        component={motion.div}
        elevation={0}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: { xs: "100%", sm: 384 },
          flexGrow: { xs: 1, sm: 0 },
          overflow: "hidden",
          borderRadius: { xs: 0, sm: 3 },
          border: { xs: "none", sm: "1px solid rgba(200,155,60,0.28)" },
          boxShadow: {
            xs: "none",
            sm: "0 30px 60px -18px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)",
          },
        }}
      >
        {/* Ticket top edge: the animated barber-pole stripe */}
        <BarberPole className="h-2.5 w-full shrink-0" />

        {/* Fills the space under the stripe on mobile so the form sits centred
            rather than clinging to the top of a tall screen. */}
        <Box
          sx={{
            flex: { xs: 1, sm: "none" },
            display: "flex",
            flexDirection: "column",
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <Box sx={{ px: 3, pb: 1, pt: 3 }}>
            {/* Wordmark */}
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                sx={{
                  mb: 0.25,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  color: "primary.dark",
                }}
              >
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: [0, -12, 0] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ display: "inline-flex" }}
                >
                  <Scissors size={24} />
                </motion.span>
                <Typography
                  className="font-display"
                  sx={{
                    fontSize: 44,
                    lineHeight: 1,
                    letterSpacing: "0.06em",
                    color: "text.primary",
                  }}
                >
                  Smart Queue
                </Typography>
              </Box>
              <Typography
                component="div"
                className="font-signage"
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.4em",
                  color: "secondary.main",
                  minHeight: 18,
                }}
              >
                {/* Reflects the selected role tab; fades in on change. */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeRoleKey}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "inline-block" }}
                  >
                    {`${role.tabLabel} Access`}
                  </motion.span>
                </AnimatePresence>
              </Typography>
            </Box>

            {/* Role tabs (MUI Tabs) — the indicator is styled as a brass pill that
              slides between tabs (MUI's own animated indicator). */}
            <Tabs
              value={activeIndex}
              onChange={(_e, v) => handleRoleChange(v)}
              variant="fullWidth"
              aria-label="Sign in as"
              sx={{
                mb: 2.5,
                minHeight: 0,
                bgcolor: "#E7DDC9", // ivory-dim
                borderRadius: 2,
                p: 0.5,
                "& .MuiTabs-indicator": {
                  top: 4,
                  bottom: 4,
                  height: "auto",
                  borderRadius: 1.5,
                  bgcolor: "primary.main", // brass
                  zIndex: 0,
                },
                "& .MuiTab-root": {
                  position: "relative",
                  zIndex: 1,
                  minHeight: 0,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  color: "text.secondary",
                  transition: "color 200ms",
                },
                // Needs `.MuiTab-root` in front: MUI's own
                // `.MuiTab-textColorPrimary.Mui-selected` rule paints the selected
                // label brass, which is invisible against the brass pill. The
                // extra class outranks it so the label stays dark ink.
                "& .MuiTab-root.Mui-selected": { color: "text.primary" },
              }}
            >
              {LOGIN_ROLE_ORDER.map((key) => (
                <Tab key={key} label={ROLES[key].tabLabel} disableRipple />
              ))}
            </Tabs>
          </Box>

          {/* Perforated tear line */}
          <Perforation />

          {/* Contextual auth form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ px: 3, pb: 3, pt: 1 }}
          >
            {/* Animate the field set swapping when the auth method changes. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role.authMethod}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {fields.map((field) => (
                  <FormField
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name]}
                    shakeSignal={shakes[field.name] ?? 0}
                    onChange={handleChange}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {formError && (
              <Typography
                sx={{
                  mb: 1.5,
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
              disabled={submitting}
              className="w-full text-[15px]"
            >
              {submitting ? (
                <>
                  <CircularProgress size={16} sx={{ color: "#241A14" }} />
                  Signing in…
                </>
              ) : (
                <>
                  {`Sign in as ${role.tabLabel}`}
                  <ArrowRight size={18} />
                </>
              )}
            </ShimmerButton>

            <Typography
              sx={{
                pt: 1.5,
                textAlign: "center",
                fontSize: 12,
                color: "text.secondary",
              }}
            >
              Customers join the queue on WhatsApp — no login needed.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </div>
  );
}
