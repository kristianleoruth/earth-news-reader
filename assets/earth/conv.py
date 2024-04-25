from PIL import Image
from threading import Thread

im = Image.open("./assets/earth/Country-Index-Map.png")
pixels = im.load()

file = open("./assets/earth/cim.csv", "w")
# file = open("./assets/earth/cim.json", "w")
count = 0
def readPixels(xrange, yrange, results, indx) -> str:
  global count
  (xs, xe) = xrange
  (ys, ye) = yrange
  print("Started readPixels on range: " + str(xs) + "->" + str(xe))
  dat = ""
  for x in range(xs, xe):
    for y in range(ys, ye):
      count += 1
      (r, g, b, a) = pixels[x, y]
      # dat += '{"r": ' + str(r) + ', "g": ' + str(g) + ', "b": ' + str(b) + ', "a":' + str(a) + '},'
      dat += f'{r},'
  print("Finished range: " + str(xs) + "->" + str(xe))
  results[indx] = dat
# for x in range(0, 2160):
#   for y in range(0, 1080):
#     (r, g, b, a) = pixels[x, y]
#     json += '{"r": ' + str(r) + ', "g": ' + str(g) + ', "b": ' + str(b) + ', "a":' + str(a) + '},'
#   print(json + str(x))

if __name__ == "__main__":
  # json = json = '{"pixels":['
  data = ""
  yrange = (0, 1080)
  result = []
  threads = []

  threadcount = 10
  w = im.width
  h = im.height
  print((w, h))
  for i in range(0, threadcount):
    yrange = (0, h)
    result.append("")
    threads.append("")
    threads[i] = Thread(target=readPixels, args=((i * round(w / threadcount), (i + 1) * round(w / threadcount)), yrange, result, i))
    threads[i].start()

  for i in range(0, threadcount):
    threads[i].join()
  

  # t0 = Thread(target=readPixels, args=((0,216), yrange, result,0))
  # t1 = Thread(target=readPixels, args=((216, 432), yrange, result,1))
  # t2 = Thread(target=readPixels, args=((432, 648), yrange, result,2))
  # t3 = Thread(target=readPixels, args=((648, 864), yrange, result,3))
  # t4 = Thread(target=readPixels, args=((864, 1080), yrange, result,4))
  # t5 = Thread(target=readPixels, args=((1080, 1296), yrange, result,5))
  # t6 = Thread(target=readPixels, args=((1296, 1512), yrange, result,6))
  # t7 = Thread(target=readPixels, args=((1512, 1728), yrange, result,7))
  # t8 = Thread(target=readPixels, args=((1728, 1944), yrange, result,8))
  # t9 = Thread(target=readPixels, args=((1944, 2160), yrange, result,9))

  # t0.start()
  # t1.start()
  # t2.start()
  # t3.start()
  # t4.start()
  # t5.start()
  # t6.start()
  # t7.start()
  # t8.start()
  # t9.start()

  # t0.join()
  # t1.join()
  # t2.join()
  # t3.join()
  # t4.join()
  # t5.join()
  # t6.join()
  # t7.join()
  # t8.join()
  # t9.join()

  # for dat in result:
  #   json+=dat

  # json += ']}'
  for dat in result:
    data += dat

  # file.write(json)
  # print(json)
  file.write(data)
  # print(data)
  print(f'Iterations: {count}')