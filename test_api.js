async function test() {
    const res = await fetch('https://7esentvbackend.vercel.app/api/mobile/fawaterak/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: 'A5r67EeXIcVpRtxRmjDey5Zgbi43', packageId: 1, paymentMethod: 'wallet' })
    });
    console.log(res.status, await res.text());
}
test();
