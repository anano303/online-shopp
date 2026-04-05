# LCP (Largest Contentful Paint) სურათის დაძებნა

## 1. Chrome DevTools-ით:

1. გახსენით Chrome DevTools (F12)
2. გადაიდით "Performance" ტაბზე
3. დააჭირეთ "Record" ღილაკს
4. განაახლეთ გვერდი
5. შეაჩერეთ recording
6. ეძიებეთ "LCP" marker-ი ან "Largest Contentful Paint"
7. დააკლიკეთ მასზე - გაჩვენებთ რომელი ელემენტია

## 2. Lighthouse-ით:

1. DevTools > Lighthouse
2. დააჭირეთ "Generate report"
3. "Performance" სექციაში იხილეთ LCP მეტრიკა
4. გაჩვენებთ რომელი ელემენტია LCP

## 3. Console-ში ლოგირება:

კოდში დაამატეთ:

```javascript
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === "largest-contentful-paint") {
      console.log("LCP element:", entry.element);
      console.log("LCP size:", entry.size);
    }
  }
}).observe({ entryTypes: ["largest-contentful-paint"] });
```

## რა უნდა გააკეთოთ:

თუ სურათი არის "above the fold" (მომხმარებელი იხავს დატვირთვისას), დაუმატეთ `priority={true}`:

```tsx
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={true} // ეს დაამატეთ
/>
```
