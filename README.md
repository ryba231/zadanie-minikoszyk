# Zadanie: mini-koszyk

## Kontekst

Sklep „Zakątek” - przykładowa implementacja. Dodanie produktu do koszyka przeładowuje stronę,
a klient nie widzi, co ma w koszyku. Grafik przygotował już wygląd bocznego koszyka (statyczna
makieta jest na końcu `index.html`, w `#mini-cart`). Twoim zadaniem jest go ożywić.

## Uruchomienie

Otwórz `index.html` w przeglądarce. Nie trzeba niczego instalować ani stawiać serwera.

## Czas i zasady

- Zakładamy **około 1 godziny** pracy.
- **Korzystanie z AI jest dozwolone i oczekiwane.** Liczy się to, co oddajesz i czy to rozumiesz.
- Czysty JavaScript, bez frameworków, bibliotek i bundlerów.
- Swój kod pisz w `js/cart.js`. Możesz zmieniać `index.html` i `css/style.css`.
- **Nie zmieniaj `js/api.js`.** Udaje backend sklepu.
- Nie musisz zrobić wszystkiego. Czego nie zdążysz, opisz w `DECISIONS.md`.

## Co ma działać

1. Przycisk „Dodaj do koszyka” na liście produktów dodaje produkt **bez przeładowania strony**.
2. Licznik przy ikonie koszyka w nagłówku pokazuje liczbę sztuk w koszyku.
3. Kliknięcie „Koszyk” otwiera boczny koszyk, a krzyżyk i kliknięcie w przyciemnione tło go zamykają.
4. Boczny koszyk pokazuje liczbę sztuk (np. „3 produkty”), produkty (nazwa, ilość, wartość) i sumę
   oraz pozwala zmienić ilość (+/−) i usunąć produkt. Statyczną makietę zastąp danymi z API.
5. Po odświeżeniu strony koszyk pokazuje aktualną zawartość.
6. Klient dostaje zrozumiały komunikat, gdy coś pójdzie nie tak, a koszyk na ekranie nie wprowadza go w błąd.

## Mile widziane

- obsługa z klawiatury i czytników ekranu,
- zamykanie koszyka klawiszem Esc,
- synchronizacja koszyka między otwartymi kartami.

## API (`js/api.js`)

API działa jak prawdziwy backend: **każde żądanie trwa różnie długo**, czasem **kończy się błędem
sieci**, a serwer pilnuje stanów magazynowych. Dane koszyka trzyma w `localStorage`.

Wszystkie metody zwracają `Promise`.

| Metoda | Opis |
| --- | --- |
| `ShopApi.getCart()` | zwraca koszyk |
| `ShopApi.addToCart(productId, qty)` | **dodaje** `qty` sztuk do tego, co już jest w koszyku |
| `ShopApi.updateQty(productId, qty)` | **ustawia** ilość produktu w koszyku na `qty` |
| `ShopApi.removeFromCart(productId)` | usuwa produkt z koszyka |

`productId` to liczba (string z liczbą też zostanie przyjęty), `qty` to liczba całkowita ≥ 1.
W odpowiedziach `productId` jest zawsze liczbą. `removeFromCart` produktu, którego nie ma w koszyku,
kończy się sukcesem.

Każda udana operacja zwraca aktualny koszyk:

```js
{
  items: [
    { productId: 101, name: 'Kubek ceramiczny „Poranek”', unitPrice: 3999, qty: 2, lineTotal: 7998 }
  ],
  totalQty: 2,
  total: 7998
}
```

**Ceny są w groszach.**

Błąd to obiekt `Error` z polem `code`:

| `code` | Kiedy |
| --- | --- |
| `NETWORK_ERROR` | zerwane połączenie; nie wiadomo, czy operacja dotarła do serwera |
| `OUT_OF_STOCK` | za mało towaru; pole `available` mówi, ile sztuk jest na stanie |
| `INVALID_QUANTITY` | niepoprawna ilość |
| `NOT_IN_CART` | `updateQty` dla produktu, którego nie ma w koszyku |
| `PRODUCT_NOT_FOUND` | produkt nie istnieje |

### Do testów

Zachowanie API zmienisz parametrami w adresie strony. Zostają po odświeżeniu:

```
index.html?errorRate=0                 bez błędów sieci
index.html?errorRate=0.5&maxDelay=3000 połowa żądań z błędem, odpowiedzi do 3 s
index.html?errorRate=1                 API całkiem niedostępne
```

| Parametr | Znaczenie | Domyślnie |
| --- | --- | --- |
| `errorRate` | odsetek żądań kończących się błędem sieci (0–1) | 0.1 |
| `minDelay` | minimalny czas żądania w ms | 300 |
| `maxDelay` | maksymalny czas żądania w ms | 1800 |

Te same wartości możesz zmienić w konsoli (`ShopApi.config.errorRate = 0`), ale wtedy wracają do
domyślnych po odświeżeniu. Koszyk wyczyścisz w konsoli: `localStorage.removeItem('shop_cart')`.

## Istniejący kod

W `js/legacy.js` jest kod, który już działa w sklepie. Możesz z niego korzystać.

## Co oddajesz

Spakowany katalog (zip) albo link do repozytorium, a w nim uzupełniony `DECISIONS.md`.
Na rozmowie poprosimy Cię o omówienie rozwiązania i drobną zmianę na żywo.
