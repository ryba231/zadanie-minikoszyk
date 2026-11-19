# Decyzje

Krótko, w punktach. Wystarczy 5–15 linijek.

- Skupiłem się na głównych wymaganiach, aby nie komplikować rozwiązania.
- Do rozwiązania zadania wykorzystałem współczesną składnie JavaScript
- Każde żądanie dostaje kolejny 'requestId', odpowiedź która przyjdzie po nowszym żądaniu zostaje pominięta co sprawi, że nie zostanie nadpisana 
- Do wyświetlania komunikatów dodałem zabezpieczenie dla nazwy produktu przed wstrzyknięciem XSS
- Dla synchronizacji koszyka między otwartymi kartami zostało wykorzystane nasłuchiwanie na storage ponieważ api w tym przypadku przechowuje wartości w LocalStorage
- Formularze dalej mają `action="/koszyk/dodaj"`, a JS tylko przechwytuje `submit`. Bez JS sklep działa jak wcześniej.
- Pozycje koszyka buduje z `<template>` i ustawiam wartości przez `textContent`

## Założenia

Co nie było opisane w zadaniu i jak to rozstrzygnąłeś/rozstrzygnęłaś?

- Przy każdym otwarciu koszyk jest pobierany z serwera na nowo, żeby pokazać aktualny stan
- Ilości nie da się zmniejszyć poniżej 1: „−” jest wtedy wyłączony, a produkt usuwa się przyciskiem „Usuń”. API przyjmuje tylko `qty ≥ 1`.

## Czego nie zrobiłem/nie zrobiłam i dlaczego

- Kliknięcia +/− w czasie ładowania są pomijane bez żadnego komunikatu.

## Jak korzystałem/korzystałam z AI

Do czego, co trzeba było poprawić po AI?

- AI wykorzystałem do wygenerowania rozwiązań, według promptów, które mu dostarczyłem. Kod który został stworzony, spełniał moje oczekiwania i nie musiałem nic poprawiać.

## Co zrobił(a)bym, mając więcej czasu

- Obsłużenie szybkiego klikania w przycisk "+", tak żeby sumowało wartość i przesyłało w requescie, bez blokowania przycisku 
