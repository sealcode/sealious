function characters_plural_form(n: number) {
	if (n == 1) {
		return "znak";
	} else if (n > 4) {
		return "znaki";
	} else {
		return "znaków";
	}
}

export const translations = {
	password_reset_email_subject: (app_name: string) =>
		`Reset hasła w ${app_name}`,
	password_reset_email_text: (app_name: string, username: string) =>
		`Witaj ${username}, ktoś użył opcji 'reset hasła' na Twoim koncie w ${app_name}. Jeżeli to byłeś Ty, kliknij w poniższy przycisk, aby dokonać zmiany hasła. W przeciwnym wypadku zignoruj tę wiadomość.`,
	password_reset_cta: () => "Zmień hasło",
	password_reset_input_cta: (email_address: string) =>
		`Wprowadź nowe hasło dla użytkownika o adresie ${email_address}`,
	reveal_password: () => "Pokaż hasło",
	registration_intent_email_subject: (app_name: string) =>
		`Nowe konto w ${app_name}`,
	registration_intent_email_text: () =>
		`Kliknij w poniższy link, aby potwierdzić swój adres email i dokończyć proces zakładania konta`,
	registration_intent_cta: () => `Założ konto`,
	registration_intent_form_description: () => `Uzupełnij dane o Twoim koncie`,
	password: () => "hasło",
	invalid_boolean: (value: string) =>
		`Wartość '${value}' nie jest w formacie zerojedynkowym.`,
	invalid_context: () =>
		`Dostarczona wartość nie jest instancją Sealious.Context.`,
	invalid_update: () => `Nie możesz zmienić ustawionej wcześniej wartości.`,
	invalid_image: () => `Dozwolone są tylko pliki z obrazami.`,
	invalid_email: (value: string) =>
		`${value} nie jest prawidłowym adresem e-mail.`,
	invalid_non_existing_value: (
		collection: string,
		field: string,
		value: string
	) =>
		`Kolekcja ${collection} posiada już rekord z '${field}' o wartości '${value}.'`,
	invalid_date: (value: string) =>
		`Wartość '${value}' nie jest w formacie daty. Wymagana jest wartość w formacie standardu ISO 8601 (YYYY-MM-DD).`,
	invalid_single_reference: (collection: string) =>
		`Nie masz dostępu do danego zasobu z kolekcji '${collection}' lub on nie istnieje.`,
	invalid_password: (length: number) =>
		`Hasło musi mieć co najmniej ${length} ${characters_plural_form(
			length
		)}.`,
	invalid_float: (value: number) =>
		`Wartość '${value}' nie jest w formacie liczby zmiennoprzecinkowej`,
	invalid_existing_value: (
		collection: string,
		field: string,
		value: string
	) => `Nie ma w ${collection} wpisu z ${field} o wartości ${value}.`,
	invalid_username: (value: string) =>
		`'${value}' to zarezerwowane słowo kluczowe. Wybierz inną nazwę użytkownika.`,
	username_taken: () => `Nazwa użytkownika jest już wykorzystywana.`,
	invalid_text: (value: string, value_type: string) =>
		`Wartość ${value} jest typu ${value_type}, zamiast ciągu znaków.`,
	too_short_text: (value: string, length: number) =>
		`Tekst '${value}' jest zbyt krótki. Minimalna długość to ${length} ${characters_plural_form(
			length
		)}.`,
	too_long_text: (value: string, length: number) =>
		`Tekst '${value}' przekracza limit ${length} ${characters_plural_form(
			length
		)}.`,
	invalid_enum: (allowed_values: string) =>
		`Dozwolone wartości: ${allowed_values}`,
	invalid_file_id: () => `Plik o podanym ID nie istnieje.`,
	invalid_json_value: (value: string) =>
		`Wartość '${value}' nie może być przedstawiona jako obiekt JSON`,
	invalid_json_object: () => `Wartość nie jest obiektem.`,
	read_only_field: () => `Pole jest przeznaczone tylko do odczytu.`,
	invalid_file_storage: () =>
		`Wartość powinna być udostępnieniem pliku lub instancją obiektu File.`,
	invalid_datetime: (value: number | string) =>
		`Wartość '${value}' nie jest w formacie daty. Tylko znaczniki czasu są akceptowalne.`,
	invalid_color: () => `Nie udało się się zinterpretować koloru.`,
	invalid_integer: (value: string) =>
		`Wartość '${value}' nie jest w formacie liczby całkowitej.`,
	too_small_integer: (value: number, min: number) =>
		`Wartość '${value}' powinna być większa lub równa ${min}.`,
	too_big_integer: (value: string, max: string) =>
		`Wartość '${value}' powinna być mniejsza lub równa ${max}.`,
	policy_if_allow: (filter_name: string) =>
		`Przedmiot przechodzi filtr '${filter_name}'.`,
	policy_public_allow: () => `Każdy jest uprawniony.`,
	policy_themselves_allow: () => `Jesteś danym użytkownikiem.`,
	policy_themselves_deny: (user_id: string) =>
		`Nie jesteś użytkownikiem o ID '${user_id}'.`,
	policy_roles_allow: (roles: string) => `Posiadasz jedną z ról: ${roles}.`,
	policy_roles_deny: (roles: string) =>
		`Nie posiadasz żadnej z ról: ${roles}.`,
	policy_logged_in_allow: () => `Jesteś zalogowany(a).`,
	policy_logged_in_deny: () => `Nie jesteś zalogowany(a).`,
	policy_owner_allow: () => `Stworzyłeś/aś ten przedmiot.`,
	policy_owner_deny: () => `Nie stworzyłeś/aś tego przedmiotu.`,
	policy_not_allow: (reason: string) => `To nieprawda, że '${reason}'.`,
	policy_super_allow: () => `Ta metoda była uruchomiona z Super-kontekstem.`,
	policy_super_deny: () =>
		`Ta metoda nie była uruchomiona z Super-kontekstem.`,
	policy_users_who_can_allow: (action: string, collection: string) =>
		`Możesz wykonać akcję '${action}' na kolekcji '${collection}'.`,
	policy_users_who_can_deny: (
		action: string,
		collection: string,
		reason: string
	) =>
		`Nie możesz wykonać akcji '${action}' na kolekcji '${collection}', ponieważ '${reason}'.`,
	policy_allow: () => `Super-kontekst jest zawsze uprawniony.`,
	policy_user_referenced_in_field_allow: (field: string) =>
		`Jesteś użytkownikiem wspomnianym w polu '${field}'.`,
	policy_user_referenced_in_field_deny: (field: string) =>
		`Nie jesteś użytkownikiem wspomnianym w polu '${field}'.`,
	policy_noone_deny: () => `Nikt nie jest uprawniony.`,
	not_allowed_domain: (domain: string, domains: string[]) =>
		`Domena ${domain} nie może być dodana do tej kolekcji. Dozwolone domeny: [${domains.join(
			", "
		)}]`,
	not_allowed_protocol: (protocol: string, protocols: string[]) =>
		`Protokół ${protocol} nie jest akceptowany przez to pole. Dozwolone protokoły: [${protocols.join(
			", "
		)}]`,
};
export default translations;
