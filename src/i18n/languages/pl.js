module.exports = {
	password_reset_email_subject: app_name => `Reset hasła w ${app_name}`,
	password_reset_email_text: ([app_name, username]) =>
		`Witaj ${username}, ktoś użył opcji 'reset hasła' na Twoim koncie w ${app_name}. Jeżeli to byłeś Ty, kliknij w poniższy przycisk, aby dokonać zmiany hasła. W przeciwnym wypadku zignoruj tę wiadomość.`,
	password_reset_cta: () => "Zmień hasło",
	password_reset_input_cta: email_address =>
		`Wprowadź nowe hasło dla użytkownika o adresie ${email_address}`,
	reveal_password: () => "Pokaż hasło",
	registration_intent_email_subject: app_name => `Nowe konto w ${app_name}`,
	registration_intent_email_text: () =>
		`Kliknij w poniższy link, aby potwierdzić swój adres email i dokończyć proces zakładania konta`,
	registration_intent_cta: () => `Założ konto`,
	registration_intent_form_description: () => `Uzupełnij dane o Twoim koncie`,
	password: () => "hasło",
};
