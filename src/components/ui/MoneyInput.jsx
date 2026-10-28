import { useLayoutEffect, useRef } from 'react'
import { formatMoneyInput, normalizeMoneyDigits } from '../../lib/utils'

/** Input Rupiah yang menampilkan pemisah ribuan, tetapi mengirim string digit tanpa format. */
export default function MoneyInput({ value, onChange, className = 'input', min, max, ...props }) {
  const inputRef = useRef(null)
  const pendingCaret = useRef(null)
  const displayValue = formatMoneyInput(value)

  const validityMessage = (digits) => {
    const amount = digits ? Number(digits) : null
    if (amount !== null && min !== undefined && amount < Number(min)) return `Nilai minimal ${formatMoneyInput(min)}.`
    if (amount !== null && max !== undefined && amount > Number(max)) return `Nilai maksimal ${formatMoneyInput(max)}.`
    return ''
  }

  useLayoutEffect(() => {
    if (!inputRef.current) return
    inputRef.current.setCustomValidity(validityMessage(normalizeMoneyDigits(value)))
    if (pendingCaret.current === null) return
    const digitPosition = pendingCaret.current
    pendingCaret.current = null
    let digitsSeen = 0
    let caret = 0
    while (caret < displayValue.length && digitsSeen < digitPosition) {
      if (/\d/.test(displayValue[caret])) digitsSeen += 1
      caret += 1
    }
    inputRef.current.setSelectionRange(caret, caret)
  }, [displayValue, value, min, max])

  const updateDigits = (digits, caretDigitPosition) => {
    const normalized = normalizeMoneyDigits(digits)
    pendingCaret.current = Math.min(caretDigitPosition, normalized.length)
    onChange?.(normalized)
  }

  const handleChange = (event) => {
    const raw = event.target.value
    const caret = event.target.selectionStart ?? raw.length
    const digitsBeforeCaret = normalizeMoneyDigits(raw.slice(0, caret)).length
    const nextDigits = normalizeMoneyDigits(raw)
    event.target.setCustomValidity(validityMessage(nextDigits))
    if (nextDigits === normalizeMoneyDigits(value)) {
      pendingCaret.current = null
      const formatted = formatMoneyInput(nextDigits)
      let formattedCaret = 0
      if (digitsBeforeCaret > 0) {
        let digitsSeen = 0
        while (formattedCaret < formatted.length && digitsSeen < digitsBeforeCaret) {
          if (/\d/.test(formatted[formattedCaret])) digitsSeen += 1
          formattedCaret += 1
        }
      }
      event.target.value = formatted
      event.target.setSelectionRange(formattedCaret, formattedCaret)
      return
    }
    updateDigits(nextDigits, digitsBeforeCaret)
  }

  const handleBlur = (event) => {
    event.currentTarget.setCustomValidity(validityMessage(normalizeMoneyDigits(event.currentTarget.value)))
    props.onBlur?.(event)
  }

  const handleKeyDown = (event) => {
    if ((event.key !== 'Backspace' && event.key !== 'Delete') || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const input = event.currentTarget
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? start
    if (start !== end) return

    const isBackspaceSeparator = event.key === 'Backspace' && start > 0 && input.value[start - 1] === '.'
    const isDeleteSeparator = event.key === 'Delete' && input.value[start] === '.'
    if (!isBackspaceSeparator && !isDeleteSeparator) return

    event.preventDefault()
    const digits = normalizeMoneyDigits(input.value)
    const digitIndex = normalizeMoneyDigits(input.value.slice(0, start)).length
    const removeIndex = event.key === 'Backspace' ? digitIndex - 1 : digitIndex
    if (removeIndex < 0 || removeIndex >= digits.length) return
    updateDigits(`${digits.slice(0, removeIndex)}${digits.slice(removeIndex + 1)}`, removeIndex)
  }

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      className={className}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  )
}
