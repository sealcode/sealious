import type * as Sealious from "../main";
import type { Socket } from "net";
import type * as url from "url";
// adding this so properties `$app` and `$context` of `ctx` are known

declare module "koa" {
	interface BaseContext {
		$context: Sealious.Context;
		$app: Sealious.App;
		$body: Record<string, unknown>;
	}
}

type Query = Record<string, unknown>;

//shamelessly copied the declarations from @types/koa. Changed here is only the
//`query` parameter type, again to help with linting
declare module "koa" {
	interface ContextDelegatedRequest {
		header: any;
		headers: any;
		url: string;
		origin: string;
		href: string;
		method: string;
		path: string;
		query: Query;
		querystring: string;
		search: string;
		host: string;
		hostname: string;
		URL: url.URL;
		fresh: boolean;
		stale: boolean;
		idempotent: boolean;
		socket: Socket;
		protocol: string;
		secure: boolean;
		ip: string;
		ips: string[];
		subdomains: string[];
		accepts(): string[] | boolean;
		accepts(...types: string[]): string | boolean;
		accepts(types: string[]): string | boolean;
		acceptsEncodings(): string[] | boolean;
		acceptsEncodings(...encodings: string[]): string | boolean;
		acceptsEncodings(encodings: string[]): string | boolean;
		acceptsCharsets(): string[] | boolean;
		acceptsCharsets(...charsets: string[]): string | boolean;
		acceptsCharsets(charsets: string[]): string | boolean;
		acceptsLanguages(): string[] | boolean;
		acceptsLanguages(...langs: string[]): string | boolean;
		acceptsLanguages(langs: string[]): string | boolean;
		get(field: string): string;
	}
}
