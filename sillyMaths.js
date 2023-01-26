function gcd(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number')) 
      return false;
    x = Math.abs(x);
    y = Math.abs(y);
    while(y) {
      var t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

function findGenerator(n){
    let i =Math.floor(n/2);
    while(gcd(i, n) != 1){
        i = ((i - 1) % n)
    }
    console.log(i)
    return i
}