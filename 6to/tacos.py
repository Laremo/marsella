tacos = int(input("¿Cuántos tacos te comiste?"))

total_sin_descuentos = tacos * 15

if tacos >= 10:
    descuento = total_sin_descuentos * .10
    total_final = total_sin_descuentos - descuento
    print("Total de la cuenta: $ ", total_final)
else: 
    print("Total de la cuenta: $ ", total_sin_descuentos)

 
